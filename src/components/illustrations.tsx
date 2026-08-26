export function HeroIllustration() {
  return (
    <svg viewBox="0 0 420 360" fill="none" className="h-auto w-full max-w-md" aria-hidden>
      {/* background blobs */}
      <circle cx="330" cy="60" r="90" fill="#6366f1" opacity="0.08" />
      <circle cx="60" cy="300" r="70" fill="#f59e0b" opacity="0.10" />
      <rect x="290" y="250" width="46" height="46" rx="14" fill="#6366f1" opacity="0.12" transform="rotate(15 313 273)" />
      <path d="M40 80l6 12 12 6-12 6-6 12-6-12-12-6 12-6z" fill="#f59e0b" opacity="0.5" />
      <circle cx="392" cy="170" r="5" fill="#6366f1" opacity="0.4" />
      <circle cx="30" cy="180" r="4" fill="#6366f1" opacity="0.3" />

      {/* professor card */}
      <g filter="url(#shadow)">
        <rect x="70" y="60" width="280" height="240" rx="20" className="fill-white dark:fill-zinc-800" stroke="#e4e4e7" />
        <rect x="70" y="60" width="280" height="64" rx="20" fill="#6366f1" opacity="0.9" />
        <rect x="70" y="104" width="280" height="20" fill="#6366f1" opacity="0.9" />
        <circle cx="210" cy="128" r="34" fill="#a5b4fc" stroke="#fff" strokeWidth="4" />
        <text x="210" y="140" textAnchor="middle" fontSize="26" fontWeight="700" fill="#312e81">GV</text>

        {/* name bar */}
        <rect x="110" y="176" width="150" height="14" rx="7" fill="#d4d4d8" />
        <rect x="110" y="198" width="100" height="9" rx="4.5" fill="#e4e4e7" />

        {/* stars */}
        <g transform="translate(110 222)">
          {[0, 30, 60, 90, 120].map((x, i) => (
            <path
              key={i}
              transform={`translate(${x} 0) scale(0.55)`}
              d="M12 2l2.9 6.3 6.9.8-5.1 4.7 1.4 6.8L12 17.2 5.9 20.6l1.4-6.8-5.1-4.7 6.9-.8z"
              fill={i < 4 ? "#fbbf24" : "#e4e4e7"}
            />
          ))}
          <text x="145" y="13" fontSize="14" fontWeight="700" fill="#18181b">4.6</text>
        </g>

        {/* score chips */}
        <g transform="translate(94 252)">
          <rect width="70" height="32" rx="10" fill="#eef2ff" />
          <text x="35" y="21" textAnchor="middle" fontSize="12" fontWeight="600" fill="#4338ca">Dễ 2.8</text>
        </g>
        <g transform="translate(174 252)">
          <rect width="70" height="32" rx="10" fill="#fef3c7" />
          <text x="35" y="21" textAnchor="middle" fontSize="12" fontWeight="600" fill="#b45309">Công bằng</text>
        </g>
        <g transform="translate(254 252)">
          <rect width="72" height="32" rx="10" fill="#dcfce7" />
          <text x="36" y="21" textAnchor="middle" fontSize="12" fontWeight="600" fill="#15803d">91% ✓</text>
        </g>
      </g>

      {/* floating student bubble */}
      <g filter="url(#shadow)">
        <rect x="16" y="130" width="118" height="58" rx="14" className="fill-white dark:fill-zinc-800" stroke="#e4e4e7" />
        <text x="30" y="152" fontSize="11" fontWeight="600" fill="#52525b">“Dạy rất dễ hiểu,</text>
        <text x="30" y="168" fontSize="11" fontWeight="600" fill="#52525b">chấm công bằng!”</text>
        <circle cx="124" cy="136" r="9" fill="#22c55e" />
        <path d="M119.5 136.5l3 3 6-6" stroke="#fff" strokeWidth="2" fill="none" strokeLinecap="round" />
      </g>

      {/* graduation cap */}
      <g transform="translate(320 28) rotate(12)">
        <path d="M24 0L48 10 24 20 0 10z" fill="#312e81" />
        <path d="M10 15v10c0 4 6.5 8 14 8s14-4 14-8V15l-14 6z" fill="#4338ca" />
        <line x1="44" y1="12" x2="44" y2="30" stroke="#fbbf24" strokeWidth="2" />
        <circle cx="44" cy="33" r="3" fill="#fbbf24" />
      </g>

      <defs>
        <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="6" stdDeviation="8" floodOpacity="0.08" />
        </filter>
      </defs>
    </svg>
  );
}

const ICONS: Record<string, string> = {
  shield: "M12 2l8 3v6c0 5-3.4 9.4-8 11-4.6-1.6-8-6-8-11V5l8-3zm-1.2 13.6l6-6-1.4-1.4-4.6 4.6-2.2-2.2-1.4 1.4 3.6 3.6z",
  pen: "M3 17.2V21h3.8L17.9 9.9l-3.8-3.8L3 17.2zM20.7 7.1c.4-.4.4-1 0-1.4l-2.4-2.4a1 1 0 00-1.4 0l-1.8 1.8 3.8 3.8 1.8-1.8z",
  rocket: "M12 2c3.5 1.6 6 5.5 6 10l-2.5 2.5H8.5L6 12c0-4.5 2.5-8.4 6-10zm0 6a2 2 0 100-4 2 2 0 000 4zM8.5 16L7 19.5 10 18h4l3 1.5L15.5 16h-7z",
};

export function Icon({ name, className }: { name: keyof typeof ICONS | string; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className ?? "h-5 w-5"} fill="currentColor" aria-hidden>
      <path d={ICONS[name] ?? ICONS.shield} />
    </svg>
  );
}
