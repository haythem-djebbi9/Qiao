import React from 'react';
import { X, ExternalLink } from 'lucide-react';

interface VideoModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Vidéo de présentation définie dans « Paramètres du site ». */
  url: string;
}

/** Lecteur intégrable pour une adresse YouTube, Vimeo ou Facebook ; null pour un fichier vidéo direct ou une autre adresse. */
export function videoEmbedUrl(url: string): string | null {
  const youtube = /(?:youtube\.com\/(?:watch\?(?:.*&)?v=|shorts\/|embed\/|live\/)|youtu\.be\/)([\w-]{6,})/i.exec(url);
  if (youtube) return `https://www.youtube-nocookie.com/embed/${youtube[1]}?autoplay=1&rel=0`;
  const vimeo = /vimeo\.com\/(?:video\/)?(\d+)/i.exec(url);
  if (vimeo) return `https://player.vimeo.com/video/${vimeo[1]}?autoplay=1`;
  if (/(^|\.)facebook\.com\/|fb\.watch\//i.test(url)) {
    return `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(url)}&show_text=false&autoplay=true`;
  }
  return null;
}

const isVideoFile = (url: string) => /\.(mp4|webm|ogg|mov)(\?|#|$)/i.test(url);

export const VideoModal: React.FC<VideoModalProps> = ({ isOpen, onClose, url }) => {
  if (!isOpen || !url) return null;
  const embed = videoEmbedUrl(url);

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="bg-slate-900 rounded-3xl max-w-4xl w-full overflow-hidden shadow-2xl border border-slate-800"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 sm:p-5 flex items-center justify-between border-b border-slate-800 text-white">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-red-600 text-white flex items-center justify-center text-sm font-bold" translate="no">
              桥
            </div>
            <h3 className="font-bold text-sm sm:text-base">Présentation de QIAO</h3>
          </div>
          <button
            onClick={onClose}
            aria-label="Fermer"
            className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="relative aspect-video bg-black">
          {embed ? (
            <iframe
              src={embed}
              title="Présentation de QIAO"
              className="absolute inset-0 w-full h-full border-0"
              allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
              allowFullScreen
            />
          ) : isVideoFile(url) ? (
            <video src={url} controls autoPlay playsInline className="absolute inset-0 w-full h-full object-contain" />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center p-6">
              <a
                href={url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-bold"
              >
                <ExternalLink className="w-4 h-4" /> Ouvrir la vidéo
              </a>
            </div>
          )}
        </div>

        <div className="p-4 bg-slate-950 flex items-center justify-between gap-3 text-xs text-slate-400">
          <a href={url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 hover:text-white">
            <ExternalLink className="w-3.5 h-3.5" /> Ouvrir dans un nouvel onglet
          </a>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl font-semibold transition-colors cursor-pointer"
          >
            Fermer la vidéo
          </button>
        </div>
      </div>
    </div>
  );
};
