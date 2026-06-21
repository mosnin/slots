'use client';

/**
 * AssetSlot — a labeled placeholder where real game art should be dropped in.
 *
 * Replace each <AssetSlot> with a real <img>/<video>/<Image> when art is ready.
 * The `id` is the suggested asset filename, `label` describes the art needed,
 * and `ratio` controls the aspect ratio of the slot.
 *
 * Example replacement:
 *   <AssetSlot id="hero-gameplay.webp" label="Gameplay screenshot" ratio="16/9" />
 *   →  <img src="/art/hero-gameplay.webp" className="w-full h-full object-cover" />
 */
interface AssetSlotProps {
  id: string;
  label: string;
  ratio?: string;          // e.g. "16/9", "1/1", "4/5"
  className?: string;
  rounded?: string;        // tailwind rounding class
  note?: string;           // extra guidance for the artist
}

export function AssetSlot({
  id,
  label,
  ratio = '16/9',
  className = '',
  rounded = 'rounded-2xl',
  note,
}: AssetSlotProps) {
  return (
    <div
      className={`relative w-full overflow-hidden ${rounded} ${className}`}
      style={{
        aspectRatio: ratio,
        background:
          'repeating-linear-gradient(45deg, rgba(251,191,36,0.04) 0px, rgba(251,191,36,0.04) 12px, rgba(255,255,255,0.015) 12px, rgba(255,255,255,0.015) 24px)',
        border: '1.5px dashed rgba(251,191,36,0.35)',
      }}
    >
      {/* Corner crop marks */}
      {[
        'top-2 left-2 border-t border-l',
        'top-2 right-2 border-t border-r',
        'bottom-2 left-2 border-b border-l',
        'bottom-2 right-2 border-b border-r',
      ].map((pos) => (
        <span
          key={pos}
          className={`absolute ${pos} w-3 h-3 border-yellow-400/40`}
        />
      ))}

      <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4 select-none">
        <div className="text-2xl mb-1 opacity-50">🖼️</div>
        <div className="text-yellow-400/70 text-xs font-bold uppercase tracking-widest">
          {label}
        </div>
        <code className="text-white/30 text-[10px] mt-1 font-mono">
          /art/{id}
        </code>
        {note && (
          <div className="text-white/25 text-[10px] mt-1 max-w-[80%]">{note}</div>
        )}
      </div>
    </div>
  );
}
