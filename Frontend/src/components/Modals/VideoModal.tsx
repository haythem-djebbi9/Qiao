import React from 'react';
import { X, Play, CheckCircle2 } from 'lucide-react';

interface VideoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const VideoModal: React.FC<VideoModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-slate-900 rounded-3xl max-w-4xl w-full overflow-hidden shadow-2xl border border-slate-800">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 flex items-center justify-between border-b border-slate-800 text-white">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-red-600 text-white flex items-center justify-center text-sm font-bold">
              桥
            </div>
            <div>
              <h3 className="font-bold text-sm sm:text-base">QIAO - La Passerelle Sino-Maghrébine</h3>
              <p className="text-xs text-slate-400">Présentation officielle & Témoignages de nos membres</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Video Player Mockup with rich visuals and active presentation playback */}
        <div className="relative aspect-video bg-black flex items-center justify-center">
          <img
            src="https://images.unsplash.com/photo-1556761175-5973dc0f32e7?auto=format&fit=crop&w=1200&q=80"
            alt="Business meeting"
            className="w-full h-full object-cover opacity-60"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent" />

          {/* Floating Play Overlay Content */}
          <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center text-white">
            <div className="w-16 h-16 rounded-full bg-red-600/90 text-white flex items-center justify-center shadow-2xl ring-8 ring-red-500/20 mb-4 animate-pulse">
              <Play className="w-8 h-8 ml-1 fill-white" />
            </div>
            <h4 className="text-xl sm:text-2xl font-bold max-w-lg">
              « Créer des partenariats industriels et commerciaux qui traversent les frontières. »
            </h4>
            <p className="text-xs text-slate-300 mt-2 max-w-md">
              Interviews exclusives des délégations d'affaires de Pékin, Shanghai, Tunis, Alger et Casablanca.
            </p>
          </div>
        </div>

        <div className="p-5 bg-slate-950 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1 text-slate-300">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Plus de 1,200 entreprises connectées</span>
            </span>
            <span>•</span>
            <span>Sous-titres en Français, Chinois et Arabe</span>
          </div>
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
