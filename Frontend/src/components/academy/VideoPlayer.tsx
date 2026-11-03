import React, { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';
import { Loader2 } from 'lucide-react';
import { LearnLesson, videoEmbed } from '../../lib/academy';

/**
 * Commande du lecteur pour les notes horodatées : instant courant et saut à un instant.
 * « timed » vaut false pour les plateformes sans API de lecteur (Dailymotion, Drive, Loom) : l'instant se saisit à la main.
 */
export interface VideoHandle {
  timed: boolean;
  getTime: () => Promise<number | null>;
  seek: (seconds: number) => void;
  pause: () => void;
}

interface YouTubePlayer {
  getCurrentTime: () => number;
  seekTo: (seconds: number, allowSeekAhead: boolean) => void;
  playVideo: () => void;
  pauseVideo: () => void;
}
interface YouTubeApi {
  Player: new (element: HTMLIFrameElement, options: { events?: { onStateChange?: (e: { data: number }) => void } }) => YouTubePlayer;
}
declare global {
  interface Window {
    YT?: YouTubeApi;
    onYouTubeIframeAPIReady?: () => void;
  }
}

/** API du lecteur YouTube, chargée une seule fois et seulement si une leçon YouTube est ouverte. */
let youtubeApi: Promise<YouTubeApi> | null = null;
function loadYouTubeApi(): Promise<YouTubeApi> {
  if (window.YT?.Player) return Promise.resolve(window.YT);
  youtubeApi ??= new Promise((resolve, reject) => {
    const previous = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      previous?.();
      if (window.YT) resolve(window.YT);
    };
    const script = document.createElement('script');
    script.src = 'https://www.youtube.com/iframe_api';
    script.async = true;
    script.onerror = () => {
      youtubeApi = null;
      reject(new Error('API YouTube indisponible'));
    };
    document.head.appendChild(script);
  });
  return youtubeApi;
}

const VIMEO_ORIGIN = 'https://player.vimeo.com';
const frameClass = 'w-full aspect-video rounded-2xl bg-slate-900 overflow-hidden border border-slate-200';

/** Lecteur d'une leçon vidéo : fichier téléversé, lien direct MP4 / WebM ou plateforme (YouTube, Vimeo, Dailymotion, Drive, Loom). */
export const VideoPlayer = forwardRef<VideoHandle, { lesson: LearnLesson; src: string | null; failed: string | null; onEnded?: () => void }>(
  ({ lesson, src, failed, onEnded }, ref) => {
    const embed = lesson.videoUrl ? videoEmbed(lesson.videoUrl) : null;
    const video = useRef<HTMLVideoElement>(null);
    const frame = useRef<HTMLIFrameElement>(null);
    const youtube = useRef<YouTubePlayer | null>(null);
    const vimeoTime = useRef<((value: number) => void) | null>(null);
    const ended = useRef(onEnded);
    ended.current = onEnded;

    // YouTube : le lecteur intégré est piloté par l'API officielle (instant courant, saut, fin de lecture).
    useEffect(() => {
      if (embed?.provider !== 'youtube' || !frame.current) return;
      let cancelled = false;
      const element = frame.current;
      loadYouTubeApi()
        .then((YT) => {
          if (cancelled) return;
          youtube.current = new YT.Player(element, { events: { onStateChange: (e) => e.data === 0 && ended.current?.() } });
        })
        .catch(() => undefined);
      return () => {
        cancelled = true;
        youtube.current = null;
      };
    }, [embed?.provider, embed?.src]);

    // Vimeo : protocole postMessage du lecteur (getCurrentTime, setCurrentTime, événement « ended »).
    useEffect(() => {
      if (embed?.provider !== 'vimeo') return;
      const post = (method: string, value?: unknown) => frame.current?.contentWindow?.postMessage(JSON.stringify(value === undefined ? { method } : { method, value }), VIMEO_ORIGIN);
      const onMessage = (event: MessageEvent) => {
        if (event.origin !== VIMEO_ORIGIN || event.source !== frame.current?.contentWindow) return;
        let data: { event?: string; method?: string; value?: unknown };
        try {
          data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
        } catch {
          return;
        }
        if (data.event === 'ready') post('addEventListener', 'ended');
        if (data.event === 'ended') ended.current?.();
        if (data.method === 'getCurrentTime' && typeof data.value === 'number') vimeoTime.current?.(data.value);
      };
      window.addEventListener('message', onMessage);
      return () => window.removeEventListener('message', onMessage);
    }, [embed?.provider, embed?.src]);

    useImperativeHandle(
      ref,
      (): VideoHandle => {
        if (!embed) {
          return {
            timed: true,
            getTime: async () => (video.current ? video.current.currentTime : null),
            seek: (seconds) => {
              if (!video.current) return;
              video.current.currentTime = seconds;
              video.current.play().catch(() => undefined);
            },
            pause: () => video.current?.pause(),
          };
        }
        if (embed.provider === 'youtube') {
          return {
            timed: true,
            getTime: async () => (youtube.current ? youtube.current.getCurrentTime() : null),
            seek: (seconds) => {
              youtube.current?.seekTo(seconds, true);
              youtube.current?.playVideo();
            },
            pause: () => youtube.current?.pauseVideo(),
          };
        }
        if (embed.provider === 'vimeo') {
          const post = (method: string, value?: unknown) => frame.current?.contentWindow?.postMessage(JSON.stringify(value === undefined ? { method } : { method, value }), VIMEO_ORIGIN);
          return {
            timed: true,
            getTime: () =>
              new Promise((resolve) => {
                const timer = setTimeout(() => resolve(null), 1500);
                vimeoTime.current = (value) => {
                  clearTimeout(timer);
                  resolve(value);
                };
                post('getCurrentTime');
              }),
            seek: (seconds) => {
              post('setCurrentTime', seconds);
              post('play');
            },
            pause: () => post('pause'),
          };
        }
        return { timed: false, getTime: async () => null, seek: () => undefined, pause: () => undefined };
      },
      [embed?.provider, embed?.src],
    );

    if (embed) {
      return (
        <iframe
          ref={frame}
          src={embed.src}
          title={lesson.title}
          className={frameClass}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
          allowFullScreen
          referrerPolicy="strict-origin-when-cross-origin"
        />
      );
    }
    if (failed) return <div className={`${frameClass} flex items-center justify-center text-sm text-slate-300`}>{failed}</div>;
    if (!src) {
      return (
        <div className={`${frameClass} flex items-center justify-center gap-2 text-sm text-slate-300`}>
          <Loader2 className="w-5 h-5 animate-spin" /> Chargement de la vidéo...
        </div>
      );
    }
    return <video ref={video} src={src} controls preload="metadata" onEnded={onEnded} className={frameClass} />;
  },
);
VideoPlayer.displayName = 'VideoPlayer';
