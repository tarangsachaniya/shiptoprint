'use client';

import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface MediaItem { url: string; type: 'image' | 'video' }

export default function ProductCarousel({ media }: { media: MediaItem[] }) {
  const [idx, setIdx] = useState(0);

  if (!media.length) {
    return (
      <div className="aspect-square rounded-2xl bg-gray-100 flex items-center justify-center text-sm text-gray-400">
        No media
      </div>
    );
  }

  const item = media[idx];
  const prev = () => setIdx(i => (i - 1 + media.length) % media.length);
  const next = () => setIdx(i => (i + 1) % media.length);

  return (
    <div className="space-y-3">
      {/* main viewer */}
      <div className="relative aspect-square rounded-2xl overflow-hidden bg-gray-100 group">
        {item.type === 'video' ? (
          <video
            key={item.url}
            src={item.url}
            autoPlay muted loop playsInline
            className="w-full h-full object-cover"
          />
        ) : (
          <img
            src={item.url}
            alt=""
            className="w-full h-full object-cover"
          />
        )}

        {media.length > 1 && (
          <>
            <button
              onClick={prev}
              className="absolute left-3 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white rounded-full p-2 shadow-sm transition-all opacity-0 group-hover:opacity-100"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={next}
              className="absolute right-3 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white rounded-full p-2 shadow-sm transition-all opacity-0 group-hover:opacity-100"
            >
              <ChevronRight size={16} />
            </button>
          </>
        )}

        {/* media type badge */}
        {item.type === 'video' && (
          <span className="absolute top-3 left-3 text-[10px] bg-black/60 text-white rounded-md px-2 py-0.5">
            Video
          </span>
        )}
      </div>

      {/* thumbnails */}
      {media.length > 1 && (
        <div className="flex gap-2 overflow-x-auto [&::-webkit-scrollbar]:hidden pb-0.5">
          {media.map((m, i) => (
            <button
              key={i}
              onClick={() => setIdx(i)}
              className={`shrink-0 w-14 h-14 rounded-xl overflow-hidden border-2 transition-all ${
                i === idx ? 'border-black scale-105' : 'border-transparent hover:border-gray-300'
              }`}
            >
              {m.type === 'video'
                ? <video src={m.url} className="w-full h-full object-cover" muted />
                : <img src={m.url} alt="" className="w-full h-full object-cover" />}
            </button>
          ))}
        </div>
      )}

      {/* dot indicators */}
      {media.length > 1 && (
        <div className="flex justify-center gap-1.5">
          {media.map((_, i) => (
            <button
              key={i}
              onClick={() => setIdx(i)}
              className={`rounded-full transition-all ${
                i === idx ? 'w-4 h-1.5 bg-black' : 'w-1.5 h-1.5 bg-gray-300 hover:bg-gray-400'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
