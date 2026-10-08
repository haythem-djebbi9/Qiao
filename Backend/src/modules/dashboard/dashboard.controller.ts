import { Controller, Get, UseGuards } from '@nestjs/common';
import { CurrentUser, JwtAuthGuard } from '../../common/auth.guards';
import { AcademyService } from '../academy/academy.service';
import { AppointmentsService } from '../appointments/appointments.service';
import { CommunityService } from '../community/community.service';
import { CompaniesService } from '../companies/companies.service';
import { ContactService } from '../contact/contact.service';
import { DocumentsService } from '../documents/documents.service';
import { EventsService } from '../events/events.service';
import { NotificationsService } from '../notifications/notifications.service';
import { OpportunitiesService } from '../opportunities/opportunities.service';
import { SimulationsService } from '../simulations/simulations.service';
import { toPublicUser, User } from '../users/user.entity';

/** Espace membre : tout ce que l'utilisateur a fait sur la plateforme. */
@Controller('me/dashboard')
@UseGuards(JwtAuthGuard)
export class DashboardController {
  constructor(
    private readonly appointments: AppointmentsService,
    private readonly events: EventsService,
    private readonly academy: AcademyService,
    private readonly community: CommunityService,
    private readonly documents: DocumentsService,
    private readonly opportunities: OpportunitiesService,
    private readonly companies: CompaniesService,
    private readonly simulations: SimulationsService,
    private readonly contact: ContactService,
    private readonly notifications: NotificationsService,
  ) {}

  @Get()
  async dashboard(@CurrentUser() user: User) {
    const [
      appointments,
      eventRegistrations,
      enrollments,
      orders,
      academy,
      connections,
      bookmarks,
      downloads,
      applications,
      companyRequests,
      simulations,
      requests,
      notifications,
    ] = await Promise.all([
      this.appointments.listForUser(user),
      this.events.listForUser(user),
      this.academy.listEnrollments(user),
      this.academy.listOrders(user),
      this.academy.summary(user),
      this.community.listConnections(user),
      this.community.listBookmarks(user),
      this.documents.listDownloadsForUser(user),
      this.opportunities.listForUser(user),
      this.companies.listRequestsForUser(user),
      this.simulations.listForUser(user),
      this.contact.listForUser(user),
      this.notifications.list(user),
    ]);

    return {
      user: toPublicUser(user),
      stats: {
        appointments: appointments.filter((a) => a.status === 'confirmed').length,
        events: eventRegistrations.length,
        enrollments: enrollments.length,
        favorites: academy.favorites.length,
        cart: academy.cart.count,
        downloads: downloads.length,
        applications: applications.length + companyRequests.length,
        connections: connections.length,
        unreadNotifications: notifications.unreadCount,
      },
      appointments,
      eventRegistrations,
      enrollments,
      orders,
      cart: academy.cart,
      connections,
      bookmarks,
      downloads,
      applications,
      companyRequests,
      simulations,
      requests,
      notifications: notifications.items,
    };
  }
}
