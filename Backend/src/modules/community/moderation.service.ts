import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, IsNull, Repository } from 'typeorm';
import { UserSession } from '../auth/auth.entities';
import { ActivityService, AuditService, RateLimiter } from '../platform/platform.services';
import { User } from '../users/user.entity';
import { CommunityAccessService } from './community-access.service';
import { CommunityNotifier, postTarget } from './community-notifier.service';
import {
  Community,
  CommunityMembership,
  CommunityPost,
  ModerationReport,
  PostComment,
  ReportStatus,
} from './community.entities';
import { CreateReportDto, ModerateContentDto, ReportsQueryDto, ResolveReportDto } from './community.dto';
import { CommunitiesService } from './communities.service';
import { MessagingService } from './messaging.service';
import { PostsService } from './posts.service';
import { ProfilesService } from './profiles.service';

export const REPORT_REASON_LABELS: Record<string, string> = {
  spam: 'Spam',
  harassment: 'Harcèlement',
  fraud: 'Fraude ou arnaque',
  impersonation: "Usurpation d'identité",
  advertising: 'Publicité non autorisée',
  illegal: 'Contenu illégal',
  credentials: 'Qualifications professionnelles trompeuses',
  privacy: "Divulgation d'informations privées",
  abuse: 'Propos abusifs ou discriminatoires',
  other: 'Autre',
};

const TERMINAL: ReportStatus[] = ['action_taken', 'rejected', 'closed'];

@Injectable()
export class ModerationService {
  constructor(
    @InjectRepository(ModerationReport) private readonly reports: Repository<ModerationReport>,
    @InjectRepository(CommunityPost) private readonly posts: Repository<CommunityPost>,
    @InjectRepository(PostComment) private readonly comments: Repository<PostComment>,
    @InjectRepository(CommunityMembership) private readonly memberships: Repository<CommunityMembership>,
    @InjectRepository(User) private readonly users: Repository<User>,
    @InjectRepository(UserSession) private readonly sessions: Repository<UserSession>,
    private readonly access: CommunityAccessService,
    private readonly notifier: CommunityNotifier,
    private readonly postsService: PostsService,
    private readonly communitiesService: CommunitiesService,
    private readonly messaging: MessagingService,
    private readonly profiles: ProfilesService,
    private readonly activity: ActivityService,
    private readonly audit: AuditService,
    private readonly rateLimiter: RateLimiter,
  ) {}

  // --- Signalement ---------------------------------------------------------------------

  async report(user: User, dto: CreateReportDto) {
    this.rateLimiter.hit(`report:${user.id}`, 10, 60 * 60_000, 'Vous avez envoyé beaucoup de signalements. Réessayez plus tard.');
    let community: Community | null = null;
    let targetUser: User | null = null;
    let snapshot: string | null = null;

    switch (dto.targetType) {
      case 'post': {
        const post = await this.postsService.findPost(dto.targetId);
        await this.access.assertCanViewPost(post, user);
        community = post.community;
        targetUser = post.author;
        snapshot = `${post.title ? `${post.title}\n` : ''}${post.content}`.slice(0, 1500);
        break;
      }
      case 'comment': {
        const comment = await this.postsService.findComment(dto.targetId);
        const post = await this.postsService.findPost(comment.post.id);
        await this.access.assertCanViewPost(post, user);
        community = post.community;
        targetUser = comment.author;
        snapshot = comment.text.slice(0, 1500);
        break;
      }
      case 'user': {
        targetUser = await this.users.findOne({ where: { id: dto.targetId } });
        if (!targetUser) throw new NotFoundException('Membre introuvable.');
        snapshot = `${targetUser.fullName} (@${targetUser.handle}) — ${targetUser.title ?? ''}`;
        break;
      }
      case 'message': {
        // Seul le message signalé est copié : la conversation reste privée.
        const message = await this.messaging.messageForReport(user, dto.targetId);
        targetUser = message.author;
        snapshot = message.body.slice(0, 1500);
        break;
      }
      case 'community': {
        const found = await this.access.findDiscoverable(dto.targetId, user);
        community = found.community;
        snapshot = `${community.name} — ${community.description}`.slice(0, 1500);
        break;
      }
    }
    if (targetUser?.id === user.id) throw new BadRequestException('Vous ne pouvez pas signaler votre propre contenu.');

    const duplicate = await this.reports.findOne({
      where: { reporter: { id: user.id }, targetType: dto.targetType, targetId: dto.targetId, status: In(['new', 'under_review']) },
    });
    if (duplicate) throw new ConflictException('Vous avez déjà signalé cet élément : il est en cours d’examen.');

    const report = await this.reports.save(
      this.reports.create({
        reporter: { id: user.id } as User,
        targetType: dto.targetType,
        targetId: dto.targetId,
        community,
        targetUser,
        snapshot,
        reason: dto.reason,
        description: dto.description?.trim() || null,
      }),
    );
    await this.activity.record('report_submitted', user.id, { type: 'report', id: report.id });

    const handlers = community && ['post', 'comment'].includes(dto.targetType)
      ? await this.communitiesService.moderatorIds(community.id)
      : (await this.users.find({ where: { role: 'admin', status: 'active' } })).map((a) => a.id);
    await this.notifier.send(
      handlers,
      'report_received',
      { title: 'Nouveau signalement à examiner', body: `${REPORT_REASON_LABELS[dto.reason]}${community ? ` — ${community.name}` : ''}` },
      { type: 'report', id: report.id, link: 'community/moderation' },
      user.id,
    );
    return { id: report.id, status: report.status };
  }

  // --- File de modération ------------------------------------------------------------------

  /** Signalements visibles : tous pour un administrateur ; ceux de ses communautés (publications, commentaires) pour un modérateur. */
  private async scope(user: User) {
    const moderated = await this.access.moderatedCommunityIds(user);
    if (moderated !== 'all' && moderated.length === 0) throw new ForbiddenException('Espace réservé aux modérateurs et administrateurs.');
    return moderated;
  }

  private canHandle(report: ModerationReport, moderated: string[] | 'all') {
    if (moderated === 'all') return true;
    return !!report.community && moderated.includes(report.community.id) && ['post', 'comment'].includes(report.targetType);
  }

  async queue(user: User, query: ReportsQueryDto) {
    const moderated = await this.scope(user);
    const qb = this.reports
      .createQueryBuilder('report')
      .leftJoinAndSelect('report.reporter', 'reporter')
      .leftJoinAndSelect('report.community', 'community')
      .leftJoinAndSelect('report.targetUser', 'targetUser')
      .leftJoinAndSelect('report.assignedTo', 'assignedTo')
      .leftJoinAndSelect('report.resolvedBy', 'resolvedBy')
      .orderBy('report.escalated', 'DESC')
      .addOrderBy('report.createdAt', 'DESC');
    const status = query.status ?? 'open';
    if (status === 'open') qb.andWhere('report.status IN (:...open)', { open: ['new', 'under_review'] });
    else if (status !== 'all') qb.andWhere('report.status = :status', { status });
    if (query.targetType) qb.andWhere('report.targetType = :targetType', { targetType: query.targetType });
    if (moderated !== 'all') {
      qb.andWhere('community.id IN (:...moderated)', { moderated }).andWhere("report.targetType IN ('post', 'comment')");
    }
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const [rows, total] = await qb.skip((page - 1) * limit).take(limit).getManyAndCount();
    const counts = await this.counts(moderated);
    return { total, page, counts, isAdmin: moderated === 'all', items: await Promise.all(rows.map((r) => this.present(r))) };
  }

  private async counts(moderated: string[] | 'all') {
    const qb = this.reports.createQueryBuilder('report').leftJoin('report.community', 'community').select('report.status', 'status').addSelect('COUNT(*)', 'count').groupBy('report.status');
    if (moderated !== 'all') qb.where('community.id IN (:...moderated)', { moderated }).andWhere("report.targetType IN ('post', 'comment')");
    const rows = await qb.getRawMany<{ status: string; count: string }>();
    return Object.fromEntries(rows.map((r) => [r.status, Number(r.count)]));
  }

  /** État actuel de l'élément signalé (sans jamais exposer une conversation privée). */
  private async targetState(report: ModerationReport) {
    switch (report.targetType) {
      case 'post': {
        const post = await this.posts.findOne({ where: { id: report.targetId } });
        return post ? { status: post.status, locked: post.locked, link: `community/post/${post.id}`, label: post.title ?? post.content.slice(0, 80) } : null;
      }
      case 'comment': {
        const comment = await this.comments.findOne({ where: { id: report.targetId }, relations: { post: true } });
        return comment ? { status: comment.status, link: `community/post/${comment.post.id}`, label: comment.text.slice(0, 80) } : null;
      }
      case 'user':
        return report.targetUser ? { status: report.targetUser.status, link: `community/member/${report.targetUser.handle}`, label: report.targetUser.fullName } : null;
      case 'community':
        return report.community ? { status: report.community.status, link: `community/c/${report.community.slug}`, label: report.community.name } : null;
      default:
        return { status: 'private', link: null, label: 'Message privé signalé' };
    }
  }

  private async present(report: ModerationReport) {
    const summaries = await this.profiles.summaries([report.reporter?.id, report.targetUser?.id].filter((id): id is string => !!id), null);
    return {
      id: report.id,
      targetType: report.targetType,
      targetId: report.targetId,
      reason: report.reason,
      reasonLabel: REPORT_REASON_LABELS[report.reason],
      description: report.description,
      snapshot: report.snapshot,
      status: report.status,
      escalated: report.escalated,
      action: report.action,
      resolution: report.resolution,
      createdAt: report.createdAt,
      resolvedAt: report.resolvedAt,
      community: report.community ? { id: report.community.id, slug: report.community.slug, name: report.community.name } : null,
      reporter: report.reporter ? summaries.get(report.reporter.id) ?? null : null,
      targetUser: report.targetUser ? summaries.get(report.targetUser.id) ?? null : null,
      assignedTo: report.assignedTo?.fullName ?? null,
      resolvedBy: report.resolvedBy?.fullName ?? null,
      target: await this.targetState(report),
    };
  }

  // --- Décisions -------------------------------------------------------------------------

  async resolve(user: User, reportId: string, dto: ResolveReportDto) {
    const moderated = await this.scope(user);
    const report = await this.reports.findOne({ where: { id: reportId } });
    if (!report || !this.canHandle(report, moderated)) throw new NotFoundException('Signalement introuvable.');
    if (TERMINAL.includes(report.status) && dto.action !== 'close') throw new BadRequestException('Ce signalement est déjà traité.');
    const isAdmin = moderated === 'all';
    const reason = dto.resolution?.trim() || REPORT_REASON_LABELS[report.reason];

    switch (dto.action) {
      case 'review':
        report.status = 'under_review';
        report.assignedTo = { id: user.id } as User;
        await this.reports.save(report);
        return this.present(await this.reports.findOneOrFail({ where: { id: report.id } }));
      case 'escalate':
        report.status = 'under_review';
        report.escalated = true;
        report.action = 'escalate';
        report.resolution = dto.resolution?.trim() || null;
        await this.reports.save(report);
        await this.audit.log(user, 'report.escalate', { type: 'report', id: report.id }, { reason: report.resolution });
        await this.notifier.send(
          (await this.users.find({ where: { role: 'admin', status: 'active' } })).map((a) => a.id),
          'report_received',
          { title: 'Signalement escaladé', body: `${user.fullName} demande l'arbitrage d'un administrateur.` },
          { type: 'report', id: report.id, link: 'community/moderation' },
          user.id,
        );
        return this.present(await this.reports.findOneOrFail({ where: { id: report.id } }));
      case 'dismiss':
        report.status = 'rejected';
        break;
      case 'close':
        report.status = 'closed';
        break;
      case 'hide':
      case 'remove':
      case 'restore':
        if (report.targetType === 'message') {
          if (!isAdmin) throw new ForbiddenException('Réservé aux administrateurs.');
          if (dto.action !== 'remove') throw new BadRequestException('Un message privé peut seulement être retiré.');
          await this.messaging.removeMessage(report.targetId);
        } else if (report.targetType === 'post' || report.targetType === 'comment') {
          await this.applyContentAction(user, report.targetType, report.targetId, dto.action, reason);
        } else {
          throw new BadRequestException('Action non applicable à ce type de signalement.');
        }
        report.status = 'action_taken';
        break;
      case 'lock':
      case 'unlock': {
        const postId = report.targetType === 'post' ? report.targetId : report.targetType === 'comment' ? (await this.postsService.findComment(report.targetId)).post.id : null;
        if (!postId) throw new BadRequestException('Action non applicable à ce type de signalement.');
        await this.applyContentAction(user, 'post', postId, dto.action, reason);
        report.status = 'action_taken';
        break;
      }
      case 'warn':
        if (!report.targetUser) throw new BadRequestException('Aucun membre concerné.');
        await this.notifier.send(
          [report.targetUser.id],
          'moderation',
          { title: 'Avertissement de la modération', body: `Motif : ${reason}. Merci de respecter les règles de QIAO Community.` },
          { type: 'settings', id: report.targetUser.id, link: 'community' },
        );
        await this.audit.log(user, 'member.warn', { type: 'member', id: report.targetUser.id, label: report.targetUser.fullName }, { report: report.id, reason });
        report.status = 'action_taken';
        break;
      case 'ban': {
        if (!report.targetUser || !report.community) throw new BadRequestException('Exclusion possible uniquement pour un contenu de communauté.');
        const membership = await this.access.membership(report.targetUser, report.community.id);
        const row = membership ?? this.memberships.create({ user: { id: report.targetUser.id } as User, community: { id: report.community.id } as Community });
        row.status = 'banned';
        row.role = 'member';
        row.decidedBy = { id: user.id } as User;
        row.decidedAt = new Date();
        await this.memberships.save(row);
        await this.communitiesService.refreshCounts(report.community.id);
        await this.audit.log(user, 'membership.ban', { type: 'member', id: report.targetUser.id, label: report.targetUser.fullName }, { community: report.community.slug, report: report.id, reason });
        await this.notifier.send(
          [report.targetUser.id],
          'moderation',
          { title: `Exclusion de ${report.community.name}`, body: `Motif : ${reason}.` },
          { type: 'community', id: report.community.id, link: `community/c/${report.community.slug}` },
        );
        report.status = 'action_taken';
        break;
      }
      case 'suspend':
        if (!isAdmin) throw new ForbiddenException('La suspension d’un compte est réservée aux administrateurs QIAO.');
        if (!report.targetUser) throw new BadRequestException('Aucun membre concerné.');
        await this.setAccountStatus(user, report.targetUser, 'suspended', dto.suspensionDays ?? 7, reason);
        report.status = 'action_taken';
        break;
    }

    report.action = dto.action;
    report.resolution = dto.resolution?.trim() || report.resolution;
    report.resolvedBy = { id: user.id } as User;
    report.resolvedAt = new Date();
    await this.reports.save(report);
    await this.audit.log(user, `report.${dto.action}`, { type: 'report', id: report.id, label: REPORT_REASON_LABELS[report.reason] }, { targetType: report.targetType, targetId: report.targetId });
    await this.activity.record('report_resolved', user.id, { type: 'report', id: report.id });
    if (report.reporter && report.status !== 'closed') {
      await this.notifier.send(
        [report.reporter.id],
        'moderation',
        {
          title: 'Votre signalement a été traité',
          body: report.status === 'action_taken' ? 'Merci : une mesure a été prise par la modération.' : "Après examen, aucune infraction aux règles n'a été retenue.",
        },
        { type: 'report', id: report.id, link: 'community' },
      );
    }
    return this.present(await this.reports.findOneOrFail({ where: { id: report.id } }));
  }

  /** Action directe d'un modérateur sur une publication ou un commentaire (sans signalement préalable). */
  async moderateContent(user: User, dto: ModerateContentDto) {
    await this.applyContentAction(user, dto.targetType, dto.targetId, dto.action, dto.reason?.trim() || null);
    return { success: true };
  }

  private async applyContentAction(user: User, targetType: 'post' | 'comment', targetId: string, action: string, reason: string | null) {
    if (targetType === 'post') {
      const post = await this.postsService.findPost(targetId);
      await this.access.assertModerator(user, post.community?.id);
      if (action === 'lock' || action === 'unlock') {
        post.locked = action === 'lock';
      } else {
        if (post.status === 'deleted' || post.status === 'draft') throw new BadRequestException('Publication non modérable.');
        post.status = action === 'hide' ? 'hidden' : action === 'remove' ? 'removed' : 'published';
      }
      await this.posts.save(post);
      if (post.community) await this.communitiesService.refreshCounts(post.community.id);
      await this.audit.log(user, `content.${action}`, { type: 'post', id: post.id, label: post.title ?? post.content.slice(0, 80) }, { reason, community: post.community?.slug ?? null });
      const labels: Record<string, string> = {
        hide: 'Votre publication a été masquée',
        remove: 'Votre publication a été retirée',
        restore: 'Votre publication est de nouveau visible',
        lock: 'Discussion verrouillée',
        unlock: 'Discussion rouverte',
      };
      await this.notifier.send(
        [post.author.id],
        'moderation',
        { title: labels[action], body: reason ? `Motif : ${reason}` : 'Décision de la modération.' },
        postTarget(post),
      );
      return;
    }
    if (!['hide', 'remove', 'restore'].includes(action)) throw new BadRequestException('Action non applicable à un commentaire.');
    const comment = await this.postsService.findComment(targetId);
    const post = await this.postsService.findPost(comment.post.id);
    await this.access.assertModerator(user, post.community?.id);
    if (comment.status === 'deleted') throw new BadRequestException('Commentaire supprimé par son auteur.');
    comment.status = action === 'hide' ? 'hidden' : action === 'remove' ? 'removed' : 'published';
    await this.comments.save(comment);
    await this.postsService.afterCommentHidden(comment);
    await this.audit.log(user, `content.${action}`, { type: 'comment', id: comment.id, label: comment.text.slice(0, 80) }, { reason, post: post.id });
    await this.notifier.send(
      [comment.author.id],
      'moderation',
      {
        title: action === 'restore' ? 'Votre commentaire est de nouveau visible' : 'Votre commentaire a été retiré par la modération',
        body: reason ? `Motif : ${reason}` : 'Décision de la modération.',
      },
      postTarget(post),
    );
  }

  /** Suspension / réactivation d'un compte (administrateurs) : sessions révoquées, décision journalisée. */
  async setAccountStatus(actor: User, target: User, status: 'active' | 'suspended', days: number | undefined, reason: string | null) {
    if (target.id === actor.id) throw new BadRequestException('Vous ne pouvez pas modifier votre propre statut.');
    if (target.role === 'admin' && status === 'suspended') throw new BadRequestException('Retirez d’abord le rôle administrateur de ce compte.');
    target.status = status;
    target.suspendedUntil = status === 'suspended' && days ? new Date(Date.now() + days * 86_400_000) : null;
    target.suspensionReason = status === 'suspended' ? reason : null;
    await this.users.save(target);
    if (status === 'suspended') {
      await this.sessions.update({ user: { id: target.id }, revokedAt: IsNull() }, { revokedAt: new Date() });
    }
    await this.audit.log(actor, status === 'suspended' ? 'member.suspend' : 'member.reactivate', { type: 'member', id: target.id, label: target.fullName }, { days: days ?? null, reason });
    await this.notifier.send(
      [target.id],
      'moderation',
      status === 'suspended'
        ? { title: 'Compte suspendu', body: `Votre compte est suspendu${days ? ` pour ${days} jour(s)` : ''}. Motif : ${reason ?? 'non communiqué'}.` }
        : { title: 'Compte réactivé', body: 'Vous pouvez de nouveau participer à QIAO Community.' },
      { type: 'settings', id: target.id, link: 'community' },
    );
    return target;
  }
}
