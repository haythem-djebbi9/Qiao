import React, { useEffect, useState } from 'react';
import { X, Calendar, Clock, Share2, ArrowRight, Download, Check, Loader2 } from 'lucide-react';
import { api } from '../../lib/api';
import { resolveImage } from '../../lib/assets';
import { Article } from '../../lib/models';
import { useDownloads } from '../../hooks/useDownloads';
import { useToast } from '../../context/ToastContext';

interface ArticleModalProps {
  articleId: string | null;
  onClose: () => void;
  onContactSpecialist: (article: Article) => void;
}

export const ArticleModal: React.FC<ArticleModalProps> = ({
  articleId,
  onClose,
  onContactSpecialist,
}) => {
  const [article, setArticle] = useState<Article | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const { downloadArticle, pending } = useDownloads();
  const { notify } = useToast();

  useEffect(() => {
    if (!articleId) return;
    setArticle(null);
    setError(null);
    api
      .get<Article>(`/articles/${articleId}`)
      .then((data) => {
        setArticle(data);
        api.post(`/articles/${articleId}/view`).catch(() => undefined);
      })
      .catch((err) => setError(err.message));
  }, [articleId]);

  if (!articleId) return null;

  const handleShare = async () => {
    const url = `${window.location.origin}${window.location.pathname}?tab=resources#article-${articleId}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      notify("Lien de l'article copié dans le presse-papiers.");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      notify('Copie impossible : votre navigateur bloque le presse-papiers.', 'error');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-2xl w-full overflow-hidden shadow-2xl border border-slate-200 max-h-[90vh] flex flex-col">
        {!article ? (
          <div className="p-10 flex flex-col items-center justify-center gap-3 text-sm text-slate-500">
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
                <span>Chargement de l'article...</span>
              </>
            )}
          </div>
        ) : (
          <>
            {/* Image banner */}
            <div className="relative h-48 sm:h-60 w-full shrink-0 bg-slate-900">
              <img
                src={resolveImage(article.image)}
                alt={article.title}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />

              <button
                onClick={onClose}
                className="absolute top-4 right-4 w-8 h-8 rounded-full bg-black/50 hover:bg-black/80 text-white flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="absolute bottom-4 left-6 right-6 text-white">
                <span className="text-[10px] font-bold uppercase tracking-wider bg-red-600 px-2.5 py-0.5 rounded-full inline-block mb-1.5">
                  {article.category}
                </span>
                <h3 className="text-lg sm:text-xl font-bold leading-snug">{article.title}</h3>
              </div>
            </div>

            {/* Article Meta */}
            <div className="px-6 py-3 bg-slate-50 border-b border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>{article.dateLabel}</span>
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{article.readTime.replace(' de lecture', '')} de lecture</span>
                </span>
              </div>
              <span className="text-slate-700 font-semibold">{article.author}</span>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto space-y-4 flex-1 text-slate-700 text-xs sm:text-sm leading-relaxed">
              <p className="font-semibold text-slate-900 text-sm sm:text-base">{article.summary}</p>
              {article.content.map((paragraph, idx) => (
                <p key={idx}>{paragraph}</p>
              ))}
              {article.keyPoints.length > 0 && (
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                  <h5 className="font-bold text-slate-900 mb-1 text-xs uppercase tracking-wider">
                    Points clés à retenir :
                  </h5>
                  <ul className="list-disc pl-5 space-y-1 text-xs text-slate-600">
                    {article.keyPoints.map((point) => (
                      <li key={point}>{point}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 sm:p-6 border-t border-slate-100 bg-slate-50 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <button
                  onClick={onClose}
                  className="px-5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm font-semibold text-slate-600 hover:bg-white cursor-pointer"
                >
                  Fermer
                </button>
                <button
                  onClick={handleShare}
                  className="p-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-white cursor-pointer"
                  title="Copier le lien"
                  aria-label="Partager l'article"
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Share2 className="w-4 h-4" />}
                </button>
                <button
                  onClick={() => downloadArticle(article.id, article.title)}
                  disabled={pending === article.id}
                  className="p-2.5 rounded-xl border border-slate-200 text-red-600 hover:bg-white cursor-pointer disabled:opacity-60"
                  title="Télécharger en PDF"
                  aria-label="Télécharger l'article en PDF"
                >
                  {pending === article.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                </button>
              </div>
              <button
                onClick={() => {
                  onClose();
                  onContactSpecialist(article);
                }}
                className="px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white text-xs sm:text-sm font-semibold rounded-xl shadow-md flex items-center gap-2 cursor-pointer"
              >
                <span>Consulter l'auteur ou un expert</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
