import React, { useEffect, useState } from 'react';
import { X, Download, FileText, Lock, Loader2, Calendar, Globe, ArrowRight } from 'lucide-react';
import { api } from '../../lib/api';
import { resolveImage } from '../../lib/assets';
import { QiaoDocument } from '../../lib/models';
import { slugify } from '../../lib/text';
import { useDownloads } from '../../hooks/useDownloads';
import { useAuth } from '../../context/AuthContext';

interface DocumentModalProps {
  /** Titre ou identifiant du document. */
  documentKey: string | null;
  onClose: () => void;
  onContactAnalyst: (doc: QiaoDocument) => void;
}

/** Fiche d'un rapport / guide avec téléchargement réel du fichier. */
export const DocumentModal: React.FC<DocumentModalProps> = ({ documentKey, onClose, onContactAnalyst }) => {
  const [doc, setDoc] = useState<QiaoDocument | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { downloadDocument, pending } = useDownloads();
  const { user } = useAuth();

  useEffect(() => {
    if (!documentKey) return;
    setDoc(null);
    setError(null);
    api
      .get<QiaoDocument>(`/documents/${slugify(documentKey)}`)
      .then(setDoc)
      .catch((err) => setError(err.message));
  }, [documentKey]);

  if (!documentKey) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-slate-200">
        {!doc ? (
          <div className="p-10 flex flex-col items-center gap-3 text-sm text-slate-500">
            {error ? (
              <>
                <span className="text-red-600 font-semibold">{error}</span>
                <button onClick={onClose} className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold cursor-pointer">
                  Fermer
                </button>
              </>
            ) : (
              <>
                <Loader2 className="w-6 h-6 animate-spin text-red-600" />
                <span>Chargement du document...</span>
              </>
            )}
          </div>
        ) : (
          <>
            <div className="relative h-36 bg-slate-900">
              {doc.image ? (
                <img src={resolveImage(doc.image)} alt={doc.title} referrerPolicy="no-referrer" className="w-full h-full object-cover opacity-70" />
              ) : (
                <div className="w-full h-full bg-gradient-to-r from-[#07152b] to-[#0c4a9e]" />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 to-transparent" />
              <button
                onClick={onClose}
                className="absolute top-4 right-4 w-8 h-8 rounded-full bg-black/50 hover:bg-black/80 text-white flex items-center justify-center cursor-pointer"
                aria-label="Fermer"
              >
                <X className="w-4 h-4" />
              </button>
              <div className="absolute bottom-3 left-5 right-5 text-white">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-red-600 px-2.5 py-0.5 rounded-full">{doc.kind}</span>
                  {doc.premium && (
                    <span className="text-[10px] font-bold uppercase tracking-wider bg-amber-400 text-slate-900 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                      <Lock className="w-3 h-3" /> Premium
                    </span>
                  )}
                </div>
                <h3 className="text-base sm:text-lg font-bold leading-snug">{doc.title}</h3>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-sm text-slate-700 leading-relaxed">{doc.description}</p>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <div className="text-slate-400 font-bold uppercase text-[10px]">Format</div>
                  <div className="font-semibold text-slate-800 flex items-center gap-1 mt-0.5">
                    <FileText className="w-3.5 h-3.5 text-red-600" />
                    {doc.format} · {doc.sizeLabel.replace(/^PDF\s*[-·]\s*/, '')}
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <div className="text-slate-400 font-bold uppercase text-[10px]">Publication</div>
                  <div className="font-semibold text-slate-800 flex items-center gap-1 mt-0.5">
                    <Calendar className="w-3.5 h-3.5 text-slate-500" />
                    {doc.dateLabel}
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 col-span-2">
                  <div className="text-slate-400 font-bold uppercase text-[10px]">Pays couverts</div>
                  <div className="font-semibold text-slate-800 flex items-center gap-1 mt-0.5">
                    <Globe className="w-3.5 h-3.5 text-slate-500" />
                    {(doc.countries ?? ['Chine', 'Afrique du Nord']).join(', ')}
                  </div>
                </div>
              </div>
              <div className="text-[11px] text-slate-500">
                {doc.downloadsLabel} · {doc.publisher}
                {doc.premium && !user && ' · Connexion requise pour cette ressource Premium'}
              </div>
            </div>
            <div className="p-4 border-t border-slate-100 bg-slate-50 flex flex-wrap items-center justify-between gap-3">
              <button
                onClick={() => {
                  onClose();
                  onContactAnalyst(doc);
                }}
                className="text-xs font-semibold text-slate-600 hover:text-red-600 flex items-center gap-1 cursor-pointer"
              >
                Analyse sur-mesure <ArrowRight className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={async () => {
                  if (await downloadDocument(doc.id, doc.title)) onClose();
                }}
                disabled={pending === doc.id}
                className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-md flex items-center gap-2 cursor-pointer disabled:opacity-60"
              >
                {pending === doc.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                <span>Télécharger ({doc.format === 'DOCX' ? 'Word' : doc.format === 'XLSX' ? 'Excel/CSV' : 'PDF'})</span>
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
