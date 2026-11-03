import React, { useCallback, useEffect, useState } from 'react';
import { CheckCircle2, ExternalLink, Loader2, MessageCircle, QrCode, Unlink } from 'lucide-react';
import { api } from '../../lib/api';
import { formatDate } from '../../lib/text';
import { useToast } from '../../context/ToastContext';
import { navigateCommunity } from '../../lib/community';
import { Card, Modal, errorMessage } from './ui';

export interface WechatStatus {
  available: boolean;
  mode: 'live' | 'mock' | 'off';
  linked: boolean;
  link: {
    status: 'active' | 'unsubscribed';
    relayMessages: boolean;
    relayAlerts: boolean;
    linkedAt: string;
    windowOpen: boolean;
    waiting: number;
  } | null;
}

interface BindQr {
  imageUrl: string | null;
  simulatorUrl: string | null;
  expiresAt: string;
  mode: 'live' | 'mock';
}

const Toggle: React.FC<{ checked: boolean; onChange: (value: boolean) => void; label: string; hint: string; disabled?: boolean }> = ({ checked, onChange, label, hint, disabled }) => (
  <label className="flex items-start justify-between gap-4 py-2.5 cursor-pointer">
    <span>
      <span className="block text-xs font-semibold text-slate-800">{label}</span>
      <span className="block text-[11px] text-slate-500">{hint}</span>
    </span>
    <input type="checkbox" checked={checked} disabled={disabled} onChange={(e) => onChange(e.target.checked)} className="mt-1 w-4 h-4 accent-[#07c160] cursor-pointer" />
  </label>
);

/** Liaison WeChat : la QR code ouvre la conversation avec le compte officiel QIAO, qui relaie la messagerie. */
const BindModal: React.FC<{ qr: BindQr; onClose: () => void }> = ({ qr, onClose }) => (
  <Modal title="Lier mon compte WeChat" icon={<QrCode className="w-4 h-4" />} onClose={onClose}>
    <div className="space-y-4 text-xs text-slate-700">
      {qr.imageUrl ? (
        <img src={qr.imageUrl} alt="QR code de liaison WeChat" className="w-56 h-56 mx-auto rounded-xl border border-slate-200" />
      ) : (
        <div className="p-4 rounded-2xl bg-[#07c160]/10 border border-[#07c160]/30 text-center space-y-3">
          <p className="font-semibold text-slate-800">Environnement de test : le compte officiel WeChat est simulé.</p>
          <a
            href={qr.simulatorUrl ?? '#'}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#07c160] hover:bg-[#06ad56] text-white font-bold"
          >
            <ExternalLink className="w-3.5 h-3.5" /> Ouvrir le simulateur WeChat
          </a>
        </div>
      )}
      <ol className="list-decimal pl-4 space-y-1">
        <li>Scannez ce QR code avec WeChat (扫一扫).</li>
        <li>Abonnez-vous au compte officiel QIAO si WeChat vous le propose.</li>
        <li>Un message de confirmation s'affiche dans WeChat : c'est terminé.</li>
      </ol>
      <p className="text-[11px] text-slate-500 flex items-center gap-1.5">
        <Loader2 className="w-3 h-3 animate-spin" /> En attente du scan… QR code valable jusqu'à{' '}
        {new Date(qr.expiresAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}.
      </p>
    </div>
  </Modal>
);

/**
 * Messagerie QIAO dans WeChat : chaque message privé reçu sur QIAO est transmis par le compte officiel QIAO,
 * et une réponse tapée dans WeChat est publiée dans la conversation QIAO.
 */
export const WechatMessagingCard: React.FC<{ compact?: boolean }> = ({ compact }) => {
  const { notify } = useToast();
  const [status, setStatus] = useState<WechatStatus | null>(null);
  const [qr, setQr] = useState<BindQr | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => api.get<WechatStatus>('/wechat/link').then((s) => (setStatus(s), s)), []);

  useEffect(() => {
    load().catch(() => setStatus(null));
  }, [load]);

  // Après affichage du QR code : on détecte la liaison dès que le membre l'a scanné.
  useEffect(() => {
    if (!qr) return;
    const timer = window.setInterval(async () => {
      try {
        const next = await load();
        if (next.linked) {
          setQr(null);
          notify('WeChat lié : vos messages QIAO arriveront dans WeChat.');
        } else if (new Date(qr.expiresAt).getTime() < Date.now()) {
          setQr(null);
          notify('Le QR code a expiré. Générez-en un nouveau.', 'error');
        }
      } catch {
        // nouvelle tentative au prochain passage
      }
    }, 2500);
    return () => window.clearInterval(timer);
  }, [qr, load, notify]);

  if (!status || !status.available) {
    if (compact || !status) return null;
    return (
      <Card>
        <p className="text-xs text-slate-500">La messagerie via WeChat n'est pas encore activée sur QIAO.</p>
      </Card>
    );
  }

  const startLink = async () => {
    setBusy(true);
    try {
      setQr(await api.post<BindQr>('/wechat/link'));
    } catch (err) {
      notify(errorMessage(err, 'QR code indisponible.'), 'error');
    } finally {
      setBusy(false);
    }
  };

  const update = async (patch: { relayMessages?: boolean; relayAlerts?: boolean }) => {
    try {
      setStatus(await api.patch<WechatStatus>('/wechat/link', patch));
    } catch (err) {
      notify(errorMessage(err), 'error');
    }
  };

  const unlink = async () => {
    if (!window.confirm('Délier votre compte WeChat ? Vous ne recevrez plus vos messages QIAO dans WeChat.')) return;
    try {
      setStatus(await api.delete<WechatStatus>('/wechat/link'));
      notify('Compte WeChat délié.');
    } catch (err) {
      notify(errorMessage(err), 'error');
    }
  };

  const link = status.link;

  if (compact) {
    return (
      <div className="px-4 py-2.5 border-b border-slate-100 bg-[#07c160]/5 flex items-center gap-2 text-[11px]">
        <MessageCircle className="w-3.5 h-3.5 text-[#07c160] shrink-0" />
        {status.linked ? (
          <span className="flex-1 text-slate-600">
            Messagerie WeChat {link?.relayMessages ? 'active : vous recevez et répondez à vos messages dans WeChat.' : 'en pause.'}
          </span>
        ) : (
          <span className="flex-1 text-slate-600">Recevez et répondez à vos messages depuis WeChat.</span>
        )}
        <button onClick={() => navigateCommunity('settings/wechat')} className="font-bold text-[#07a050] hover:underline cursor-pointer whitespace-nowrap">
          {status.linked ? 'Gérer' : 'Lier WeChat'}
        </button>
      </div>
    );
  }

  return (
    <Card>
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-[#07c160] text-white flex items-center justify-center shrink-0">
          <MessageCircle className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-bold text-slate-900">Messagerie via WeChat</h3>
          <p className="text-xs text-slate-600 mt-0.5">
            Recevez vos messages privés QIAO dans WeChat, par le compte officiel QIAO, et répondez directement depuis WeChat : vos réponses sont
            publiées dans la conversation QIAO.
          </p>
          {status.mode === 'mock' && <p className="mt-1 text-[11px] font-semibold text-amber-700">Environnement de test : WeChat est simulé.</p>}
        </div>
      </div>

      {status.linked && link ? (
        <div className="mt-4 space-y-3">
          <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            Compte WeChat lié depuis le {formatDate(link.linkedAt)}.
          </div>
          {!link.windowOpen && (
            <p className="text-[11px] text-slate-500">
              WeChat n'autorise l'envoi de messages qu'après une action de votre part dans les 48 dernières heures. Au-delà, vous recevez une
              notification et vos messages vous sont transmis dès que vous écrivez au compte officiel QIAO
              {link.waiting > 0 ? ` (${link.waiting} en attente)` : ''}.
            </p>
          )}
          <div className="divide-y divide-slate-100 border-y border-slate-100">
            <Toggle
              checked={link.relayMessages}
              onChange={(value) => update({ relayMessages: value })}
              label="Recevoir mes messages privés dans WeChat"
              hint="Et y répondre. Commandes dans WeChat : « liste », « #code message », « aide »."
            />
            <Toggle
              checked={link.relayAlerts}
              onChange={(value) => update({ relayAlerts: value })}
              label="Recevoir aussi mes alertes QIAO"
              hint="Paiements, litiges, réponses à mes questions, abonnés…"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={startLink}
              disabled={busy}
              className="px-4 py-2 rounded-full border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-60"
            >
              <QrCode className="w-3.5 h-3.5" /> Lier un autre WeChat
            </button>
            <button onClick={unlink} className="px-4 py-2 rounded-full border border-red-200 text-xs font-bold text-red-600 hover:bg-red-50 inline-flex items-center gap-1.5 cursor-pointer">
              <Unlink className="w-3.5 h-3.5" /> Délier
            </button>
          </div>
        </div>
      ) : (
        <div className="mt-4 space-y-3">
          {link?.status === 'unsubscribed' && (
            <p className="text-xs text-amber-700">Vous vous êtes désabonné du compte officiel QIAO : scannez à nouveau le QR code pour réactiver la messagerie.</p>
          )}
          <p className="text-[11px] text-slate-500">
            En liant votre compte, les messages privés qui vous sont adressés sur QIAO sont transmis à WeChat (Tencent) pour vous être remis. Vous
            pouvez délier votre compte à tout moment.
          </p>
          <button
            onClick={startLink}
            disabled={busy}
            className="px-5 py-2 rounded-full bg-[#07c160] hover:bg-[#06ad56] text-white text-xs font-bold shadow-sm inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-60"
          >
            {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <QrCode className="w-3.5 h-3.5" />} Lier mon compte WeChat
          </button>
        </div>
      )}
      {qr && <BindModal qr={qr} onClose={() => setQr(null)} />}
    </Card>
  );
};
