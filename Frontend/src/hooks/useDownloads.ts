import { useCallback, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { ApiError, downloadFile } from '../lib/api';
import { slugify } from '../lib/text';

/** Téléchargements réels des documents (PDF / Word / CSV générés par l'API). */
export function useDownloads() {
  const { notify } = useToast();
  const { openAuth } = useAuth();
  const [pending, setPending] = useState<string | null>(null);

  const run = useCallback(
    async (key: string, path: string, label: string, fallbackName: string) => {
      setPending(key);
      try {
        const filename = await downloadFile(path, fallbackName);
        notify(`« ${label} » téléchargé (${filename}).`);
        return true;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Téléchargement impossible.';
        notify(message, 'error');
        if (err instanceof ApiError && err.status === 401) openAuth('login', message);
        return false;
      } finally {
        setPending(null);
      }
    },
    [notify, openAuth],
  );

  /** Télécharge un document par son titre (identifiant = slug du titre) ou son id. */
  const downloadDocument = useCallback(
    (titleOrId: string, label = titleOrId) => {
      const id = slugify(titleOrId);
      return run(id, `/documents/${id}/download`, label, `${id}.pdf`);
    },
    [run],
  );

  const downloadArticle = useCallback(
    (articleId: string, label: string) => run(articleId, `/articles/${articleId}/download`, label, `${articleId}.pdf`),
    [run],
  );

  return { downloadDocument, downloadArticle, pending };
}
