import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowLeft, Ban, Flag, Loader2, Lock, Mail, MessageSquare, Send, ShieldCheck } from 'lucide-react';
import { api } from '../../lib/api';
import {
  ConversationSummary,
  ConversationThread,
  MESSAGE_RESTRICTIONS,
  MemberProfileView,
  navigateCommunity,
} from '../../lib/community';
import { timeAgo } from '../../lib/text';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { ActionMenu } from './PostCard';
import { Avatar, EmptyState, Loading, MemberName, ReportModal, errorMessage } from './ui';
import { WechatMessagingCard } from './WechatMessagingCard';

const POLL_MS = 15_000;

/** Messagerie privée : seuls les deux participants accèdent à la conversation. */
export const MessagesView: React.FC<{ conversationId?: string; query: URLSearchParams }> = ({ conversationId, query }) => {
  const { user, requireAuth } = useAuth();
  const [conversations, setConversations] = useState<ConversationSummary[] | null>(null);

  const loadList = useCallback(() => {
    api
      .get<{ items: ConversationSummary[]; unread: number }>('/community/conversations')
      .then((result) => setConversations(result.items))
      .catch(() => setConversations([]));
  }, []);

  useEffect(() => {
    if (!user) return;
    loadList();
    const timer = setInterval(loadList, POLL_MS);
    return () => clearInterval(timer);
  }, [user, loadList]);

  if (!user) {
    return (
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
        <EmptyState icon={<Lock className="w-10 h-10" />} text="Connectez-vous pour accéder à votre messagerie." action={{ label: 'Se connecter', onClick: () => requireAuth(() => undefined) }} />
      </div>
    );
  }

  const isNew = conversationId === 'new';

  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden grid grid-cols-1 md:grid-cols-12 min-h-[560px]">
      {/* Liste des conversations */}
      <aside className={`md:col-span-4 border-r border-slate-100 ${conversationId ? 'hidden md:block' : ''}`}>
        <div className="p-4 border-b border-slate-100">
          <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
            <Mail className="w-4 h-4 text-red-600" /> Messages
          </h2>
          <p className="text-[11px] text-slate-500 mt-0.5">Échanges privés, invisibles des autres membres et des modérateurs.</p>
        </div>
        <WechatMessagingCard compact />
        {conversations === null ? (
          <Loading />
        ) : conversations.length === 0 ? (
          <div className="p-6 text-center text-xs text-slate-400">
            Aucune conversation. Contactez un membre depuis son profil ou l'annuaire des experts.
            <button onClick={() => navigateCommunity('experts')} className="block mx-auto mt-3 font-bold text-red-600 cursor-pointer">
              Trouver un expert
            </button>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 max-h-[620px] overflow-y-auto">
            {conversations.map((conversation) => (
              <button
                key={conversation.id}
                onClick={() => navigateCommunity(`messages/${conversation.id}`)}
                className={`w-full text-left p-3.5 flex items-start gap-3 transition-colors cursor-pointer ${
                  conversation.id === conversationId ? 'bg-red-50/60' : 'hover:bg-slate-50'
                }`}
              >
                <Avatar src={conversation.other?.avatarUrl} name={conversation.other?.fullName ?? '?'} className="w-10 h-10 border border-slate-200" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className={`text-xs truncate ${conversation.unread ? 'font-black text-slate-900' : 'font-bold text-slate-800'}`}>
                      {conversation.other?.fullName ?? 'Membre'}
                    </span>
                    <span className="text-[10px] text-slate-400 shrink-0">{timeAgo(conversation.lastMessageAt)}</span>
                  </div>
                  {conversation.context?.label && <p className="text-[10px] text-blue-600 truncate">{conversation.context.label}</p>}
                  <p className={`text-[11px] truncate ${conversation.unread ? 'text-slate-900 font-semibold' : 'text-slate-500'}`}>
                    {conversation.lastMessage ? `${conversation.lastMessage.fromMe ? 'Vous : ' : ''}${conversation.lastMessage.body}` : '—'}
                  </p>
                </div>
                {conversation.unread > 0 && (
                  <span className="mt-1 min-w-5 h-5 px-1 rounded-full bg-red-600 text-white text-[10px] font-bold flex items-center justify-center">{conversation.unread}</span>
                )}
              </button>
            ))}
          </div>
        )}
      </aside>

      {/* Conversation */}
      <section className={`md:col-span-8 flex flex-col ${conversationId ? '' : 'hidden md:flex'}`}>
        {isNew ? (
          <NewConversation handle={query.get('to') ?? ''} postId={query.get('post')} context={query.get('context')} onCreated={loadList} />
        ) : conversationId ? (
          <Thread key={conversationId} conversationId={conversationId} onActivity={loadList} />
        ) : (
          <div className="flex-1 flex items-center justify-center p-8">
            <EmptyState icon={<MessageSquare className="w-10 h-10" />} text="Sélectionnez une conversation." />
          </div>
        )}
      </section>
    </div>
  );
};

const Thread: React.FC<{ conversationId: string; onActivity: () => void }> = ({ conversationId, onActivity }) => {
  const { notify } = useToast();
  const [thread, setThread] = useState<ConversationThread | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [reportMessage, setReportMessage] = useState<{ id: string; body: string } | null>(null);
  const [reportMember, setReportMember] = useState(false);
  const bottom = useRef<HTMLDivElement>(null);

  const load = useCallback(
    (scroll = false) =>
      api
        .get<ConversationThread>(`/community/conversations/${conversationId}`)
        .then((data) => {
          setThread(data);
          onActivity();
          window.dispatchEvent(new Event('qiao:refresh-counters'));
          if (scroll) setTimeout(() => bottom.current?.scrollIntoView({ block: 'end' }), 30);
        })
        .catch((err) => setError(errorMessage(err, 'Conversation introuvable.'))),
    [conversationId, onActivity],
  );

  useEffect(() => {
    load(true);
    const timer = setInterval(() => load(false), POLL_MS);
    return () => clearInterval(timer);
  }, [load]);

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    const body = draft.trim();
    if (!body) return;
    setSending(true);
    try {
      await api.post(`/community/conversations/${conversationId}/messages`, { body });
      setDraft('');
      await load(true);
    } catch (err) {
      notify(errorMessage(err, 'Message non envoyé.'), 'error');
    } finally {
      setSending(false);
    }
  };

  const block = async () => {
    if (!thread?.other?.handle || !window.confirm(`Bloquer ${thread.other.fullName} ? Vous ne pourrez plus échanger avec ce membre.`)) return;
    try {
      await api.post(`/community/members/${thread.other.handle}/block`);
      notify('Membre bloqué.');
      load(false);
    } catch (err) {
      notify(errorMessage(err), 'error');
    }
  };

  if (error) return <EmptyState icon={<Lock className="w-10 h-10" />} text={error} />;
  if (!thread) return <Loading />;

  return (
    <>
      <header className="p-4 border-b border-slate-100 flex items-center gap-3">
        <button onClick={() => navigateCommunity('messages')} className="md:hidden p-1 text-slate-500 cursor-pointer" aria-label="Retour aux conversations">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <Avatar src={thread.other?.avatarUrl} name={thread.other?.fullName ?? '?'} className="w-10 h-10 border border-slate-200" />
        <div className="flex-1 min-w-0">
          <MemberName member={thread.other} className="text-sm font-bold text-slate-900" />
          <p className="text-[11px] text-slate-500 truncate">{thread.other?.headline}</p>
        </div>
        <ActionMenu
          items={[
            { label: 'Signaler ce membre', icon: Flag, onClick: () => setReportMember(true) },
            { label: 'Bloquer ce membre', icon: Ban, onClick: block, danger: true },
          ]}
        />
      </header>
      {thread.context?.label && (
        <button
          onClick={() => thread.context?.type === 'post' && thread.context.id ? navigateCommunity(`post/${thread.context.id}`) : undefined}
          className="mx-4 mt-3 px-3 py-2 rounded-xl bg-blue-50 border border-blue-100 text-[11px] text-blue-800 text-left cursor-pointer"
        >
          À propos de : <strong>{thread.context.label}</strong>
          <span className="block text-[10px] text-blue-600/80">Prise de contact entre membres : aucune commande ni demande de service n'est créée.</span>
        </button>
      )}
      <div className="flex-1 overflow-y-auto p-4 space-y-2.5 max-h-[460px] bg-slate-50/40">
        {thread.messages.map((message) => (
          <div key={message.id} className={`group flex ${message.fromMe ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] rounded-2xl px-3.5 py-2 text-xs leading-relaxed ${message.fromMe ? 'bg-red-600 text-white rounded-br-sm' : 'bg-white border border-slate-200 text-slate-800 rounded-bl-sm'}`}>
              {message.body === null ? <span className="italic opacity-70">Message retiré par l'administration</span> : <p className="whitespace-pre-line break-words">{message.body}</p>}
              <div className={`mt-1 flex items-center gap-2 text-[9px] ${message.fromMe ? 'text-red-100' : 'text-slate-400'}`}>
                {timeAgo(message.createdAt, 'long')}
                {message.source === 'wechat' && <span className="font-semibold">· via WeChat</span>}
                {!message.fromMe && message.body && (
                  <button onClick={() => setReportMessage({ id: message.id, body: message.body! })} className="hidden group-hover:inline hover:underline cursor-pointer">
                    Signaler
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
        <div ref={bottom} />
      </div>
      {thread.canSend ? (
        <form onSubmit={send} className="p-3 border-t border-slate-100 flex items-end gap-2">
          <textarea
            rows={2}
            maxLength={4000}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                send(e as unknown as React.FormEvent);
              }
            }}
            placeholder="Écrire un message..."
            className="flex-1 px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-red-500 resize-none"
          />
          <button type="submit" disabled={sending} aria-label="Envoyer" className="w-10 h-10 rounded-full bg-red-600 hover:bg-red-700 text-white flex items-center justify-center cursor-pointer disabled:opacity-60">
            {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </button>
        </form>
      ) : (
        <p className="p-4 border-t border-slate-100 text-xs text-slate-500 text-center">{thread.restriction}</p>
      )}
      {reportMessage && <ReportModal target={{ type: 'message', id: reportMessage.id, label: reportMessage.body }} onClose={() => setReportMessage(null)} />}
      {reportMember && thread.other && <ReportModal target={{ type: 'user', id: thread.other.id, label: thread.other.fullName }} onClose={() => setReportMember(false)} />}
    </>
  );
};

/** Premier message à un membre, depuis son profil, l'annuaire ou une question (le contexte est conservé). */
const NewConversation: React.FC<{ handle: string; postId: string | null; context: string | null; onCreated: () => void }> = ({ handle, postId, context, onCreated }) => {
  const { notify } = useToast();
  const [profile, setProfile] = useState<MemberProfileView | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    api
      .get<MemberProfileView>(`/community/members/${handle}`)
      .then(setProfile)
      .catch((err) => setError(errorMessage(err, 'Membre introuvable.')));
  }, [handle]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    setSending(true);
    try {
      const result = await api.post<{ id: string }>('/community/conversations', {
        recipientId: profile.id,
        body,
        contextType: postId ? 'post' : context === 'profile' ? 'profile' : undefined,
        contextId: postId ?? (context === 'profile' ? handle : undefined),
      });
      onCreated();
      navigateCommunity(`messages/${result.id}`, { replace: true });
    } catch (err) {
      notify(errorMessage(err, 'Message non envoyé.'), 'error');
    } finally {
      setSending(false);
    }
  };

  if (error) return <EmptyState icon={<Lock className="w-10 h-10" />} text={error} />;
  if (!profile) return <Loading />;
  const restriction = profile.relationship.canMessage ? null : MESSAGE_RESTRICTIONS[profile.relationship.messageRestriction ?? ''] || 'Messagerie indisponible.';

  return (
    <div className="p-5 sm:p-6 space-y-4">
      <div className="flex items-center gap-3">
        <Avatar src={profile.avatarUrl} name={profile.fullName} className="w-12 h-12 border border-slate-200" />
        <div>
          <MemberName member={profile} className="text-sm font-bold text-slate-900" />
          <p className="text-[11px] text-slate-500">{profile.headline}</p>
        </div>
      </div>
      {restriction ? (
        <p className="text-xs text-slate-600 bg-slate-50 border border-slate-200 rounded-xl p-3">{restriction}</p>
      ) : (
        <form onSubmit={submit} className="space-y-3">
          {postId && <p className="text-[11px] text-blue-800 bg-blue-50 border border-blue-100 rounded-xl px-3 py-2">Votre message fera référence à la discussion d'origine.</p>}
          <textarea
            rows={6}
            required
            maxLength={4000}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder={`Bonjour ${profile.fullName.split(' ')[0]}, ...`}
            className="w-full rounded-xl border border-slate-200 p-3 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
          />
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] text-slate-400 inline-flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-emerald-600" /> Conversation privée entre vous deux.
            </span>
            <button disabled={sending || !body.trim()} className="px-5 py-2 rounded-full bg-red-600 hover:bg-red-700 text-white text-xs font-bold cursor-pointer inline-flex items-center gap-1.5 disabled:opacity-60">
              {sending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />} Envoyer
            </button>
          </div>
        </form>
      )}
    </div>
  );
};
