/** Crisp inline SVG icons — no emoji, no external assets. */

export function CheckIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden>
      <defs>
        <linearGradient id="ckg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#34d399" />
          <stop offset="1" stopColor="#059669" />
        </linearGradient>
      </defs>
      <circle cx="32" cy="32" r="30" fill="url(#ckg)" />
      <path
        d="M18 33 L28 43 L46 23"
        fill="none"
        stroke="#fff"
        strokeWidth="7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function CrossIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden>
      <defs>
        <linearGradient id="crg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#f87171" />
          <stop offset="1" stopColor="#dc2626" />
        </linearGradient>
      </defs>
      <circle cx="32" cy="32" r="30" fill="url(#crg)" />
      <path
        d="M22 22 L42 42 M42 22 L22 42"
        stroke="#fff"
        strokeWidth="7"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function ClockIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden>
      <defs>
        <linearGradient id="clg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#fbbf24" />
          <stop offset="1" stopColor="#d97706" />
        </linearGradient>
      </defs>
      <circle cx="32" cy="34" r="26" fill="url(#clg)" />
      <circle cx="32" cy="34" r="20" fill="#fff" />
      <path
        d="M32 22 L32 34 L41 39"
        fill="none"
        stroke="#d97706"
        strokeWidth="5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <rect x="26" y="2" width="12" height="6" rx="3" fill="#d97706" />
      <rect x="8" y="8" width="10" height="5" rx="2.5" fill="#d97706" transform="rotate(-35 13 10)" />
      <rect x="46" y="8" width="10" height="5" rx="2.5" fill="#d97706" transform="rotate(35 51 10)" />
    </svg>
  );
}

export function BoltIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden>
      <defs>
        <linearGradient id="blg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#facc15" />
          <stop offset="1" stopColor="#f59e0b" />
        </linearGradient>
      </defs>
      <path
        d="M37 4 L14 36 h13 L27 60 L50 28 H37 z"
        fill="url(#blg)"
        stroke="#d97706"
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function TrophyIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden>
      <defs>
        <linearGradient id="trg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fde047" />
          <stop offset="1" stopColor="#f59e0b" />
        </linearGradient>
      </defs>
      <path
        d="M18 8 h28 v14 a14 14 0 0 1 -28 0 z"
        fill="url(#trg)"
        stroke="#d97706"
        strokeWidth="2"
      />
      <path
        d="M18 12 H8 v4 a10 10 0 0 0 10 8 M46 12 h10 v4 a10 10 0 0 1 -10 8"
        fill="none"
        stroke="#d97706"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <rect x="28" y="34" width="8" height="10" fill="#d97706" />
      <rect x="20" y="44" width="24" height="6" rx="2" fill="url(#trg)" stroke="#d97706" strokeWidth="2" />
      <rect x="16" y="50" width="32" height="7" rx="2" fill="#b45309" />
      <path d="M27 14 l3 6 -5 -1 z" fill="#fff" opacity="0.5" />
    </svg>
  );
}

const MEDAL_COLORS: Record<number, [string, string, string]> = {
  1: ["#fde047", "#f59e0b", "#b45309"],
  2: ["#e2e8f0", "#94a3b8", "#64748b"],
  3: ["#fdba74", "#ea580c", "#9a3412"],
};

export function MedalIcon({
  rank,
  className = "",
}: {
  rank: 1 | 2 | 3;
  className?: string;
}) {
  const [light, mid, dark] = MEDAL_COLORS[rank];
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden>
      <path d="M22 2 h8 l6 18 -12 4 z" fill="#ef4444" />
      <path d="M42 2 h-8 l-4 18 10 4 z" fill="#6d28d9" />
      <circle cx="32" cy="40" r="20" fill={mid} stroke={dark} strokeWidth="2.5" />
      <circle cx="32" cy="40" r="14" fill={light} />
      <text
        x="32"
        y="47"
        textAnchor="middle"
        fontSize="20"
        fontWeight="900"
        fontFamily="Arial, sans-serif"
        fill={dark}
      >
        {rank}
      </text>
    </svg>
  );
}

export function CopyIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden>
      <rect
        x="9"
        y="9"
        width="11"
        height="12"
        rx="2.5"
        stroke="currentColor"
        strokeWidth="2"
      />
      <path
        d="M15 5 H7 a3 3 0 0 0 -3 3 v9"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function CheckSmallIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden>
      <path
        d="M5 13 L10 18 L19 7"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function FlameIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden>
      <defs>
        <linearGradient id="flg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#f97316" />
          <stop offset="1" stopColor="#dc2626" />
        </linearGradient>
        <linearGradient id="fli" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fde047" />
          <stop offset="1" stopColor="#f97316" />
        </linearGradient>
      </defs>
      <path
        d="M32 4 C34 16 46 20 46 36 a14 14 0 0 1 -28 0 C18 26 26 22 26 12 C29 15 31 18 32 22 C34 16 32 10 32 4 z"
        fill="url(#flg)"
      />
      <path
        d="M32 26 C34 32 40 34 40 42 a8 8 0 0 1 -16 0 C24 36 30 33 32 26 z"
        fill="url(#fli)"
      />
    </svg>
  );
}
