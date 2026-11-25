import React from 'react';
import { MessageCircle } from 'lucide-react';
import { resolveImage } from '../../lib/assets';
import { siteSettings, wechatQrSquare } from '../../lib/siteSettings';

/**
 * Carte « WeChat » avec le QR code de QIAO (Paramètres du site > QR code WeChat).
 * - tone « light » : carte blanche, pour les colonnes de QIAO Community (forum) ;
 * - tone « dark » : pour le pied de page bleu nuit.
 * Rien n'est affiché si aucun QR code n'est renseigné.
 */
export const WeChatQrCard: React.FC<{ tone?: 'light' | 'dark'; className?: string; lazy?: boolean }> = ({
  tone = 'light',
  className = '',
  lazy = false,
}) => {
  const qr = siteSettings().wechatQr;
  if (!qr) return null;
  const image = (
    <img
      src={resolveImage(wechatQrSquare(qr))}
      alt="QR code WeChat QIAO"
      loading={lazy ? 'lazy' : undefined}
      className={
        tone === 'dark'
          ? 'w-[92px] h-[92px] shrink-0 rounded-xl bg-white p-1.5 object-contain'
          : 'w-28 h-28 shrink-0 rounded-xl bg-white border border-slate-200 p-1.5 object-contain'
      }
    />
  );

  if (tone === 'dark') {
    return (
      <div className={`flex items-center gap-3.5 max-w-xs rounded-2xl bg-white/[0.04] border border-slate-700/70 p-3 ${className}`}>
        {image}
        <div className="min-w-0 space-y-1">
          <div className="flex items-center gap-1.5 text-sm font-bold text-white">
            <MessageCircle className="w-4 h-4 text-[#07c160] fill-[#07c160]/20" />
            <span>WeChat</span>
          </div>
          <p className="text-[11px] leading-snug text-slate-400">Scannez le QR code avec votre application WeChat</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white border border-slate-200 rounded-2xl p-4 shadow-xs ${className}`}>
      <div className="flex items-center gap-4">
        {image}
        <div className="min-w-0 space-y-1.5">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-[#07c160]/10 px-2.5 py-1 text-[11px] font-bold text-[#06a050]">
            <MessageCircle className="w-3.5 h-3.5 fill-[#07c160]/20" />
            <span>WeChat</span>
          </div>
          <h3 className="text-sm font-bold text-slate-900 leading-snug">Scannez pour rejoindre sur WeChat</h3>
          <p className="text-xs text-slate-500 leading-relaxed">Discutez directement avec notre équipe sur WeChat pour une réponse rapide.</p>
        </div>
      </div>
    </div>
  );
};
