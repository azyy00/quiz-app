"use client";

import { useMemo } from "react";
import { avatarUri } from "@/components/Avatar";

/**
 * Legendary champion scene for 1st place: the winner's own avatar,
 * crowned and caped, standing on the #1 podium waving one arm, with
 * sparkles. Animations are pure CSS (see globals.css: champ-wave,
 * champ-bob, sparkle-twinkle, pop-in).
 */
export default function Champion({ name }: { name: string }) {
  const face = useMemo(() => avatarUri(name), [name]);
  return (
    <div className="pop-in flex flex-col items-center">
      <svg viewBox="0 0 220 210" className="h-56 w-auto" aria-hidden>
        {/* sparkles */}
        {[
          [30, 40, 5, "0s"],
          [190, 30, 4, "0.4s"],
          [170, 80, 3, "0.8s"],
          [40, 95, 4, "1.2s"],
          [205, 120, 3, "0.2s"],
        ].map(([x, y, r, delay], i) => (
          <g key={i} className="sparkle" style={{ animationDelay: String(delay) }}>
            <path
              d={`M${x} ${Number(y) - Number(r) * 2} L${Number(x) + Number(r)} ${y} L${x} ${Number(y) + Number(r) * 2} L${Number(x) - Number(r)} ${y} Z`}
              fill="#facc15"
            />
          </g>
        ))}

        {/* podium */}
        <rect x="60" y="150" width="100" height="55" rx="6" fill="#1E90FF" />
        <rect x="60" y="150" width="100" height="10" rx="5" fill="#63B8FF" />
        <text
          x="110"
          y="190"
          textAnchor="middle"
          fontSize="30"
          fontWeight="900"
          fontFamily="Arial, sans-serif"
          fill="#fff"
        >
          1
        </text>

        {/* character (bobs gently) */}
        <g className="champ-body">
          {/* cape */}
          <path
            d="M96 92 Q86 120 90 148 L110 142 L130 148 Q134 120 124 92 z"
            fill="#dc2626"
          />
          {/* legs */}
          <rect x="99" y="130" width="9" height="22" rx="4" fill="#1e293b" />
          <rect x="112" y="130" width="9" height="22" rx="4" fill="#1e293b" />
          {/* torso */}
          <rect x="94" y="90" width="32" height="46" rx="12" fill="#ef4444" />
          <path d="M110 96 l4 8 h-8 z" fill="#fde047" />
          {/* static arm (left, resting) */}
          <rect
            x="86"
            y="94"
            width="9"
            height="30"
            rx="4.5"
            fill="#ef4444"
            transform="rotate(12 90 96)"
          />
          <circle cx="86" cy="126" r="5.5" fill="#fcd34d" />
          {/* waving arm (right) — pivots at the shoulder */}
          <g className="champ-arm">
            <rect x="122" y="66" width="9" height="34" rx="4.5" fill="#ef4444" />
            <circle cx="126.5" cy="64" r="6" fill="#fcd34d" />
          </g>
          {/* head: the winner's own avatar */}
          <circle cx="110" cy="70" r="20" fill="#fff" stroke="#e2e8f0" strokeWidth="1" />
          <image href={face} x="92" y="52" width="36" height="36" />
          {/* crown */}
          <path
            d="M96 50 L100 36 L106 44 L110 32 L114 44 L120 36 L124 50 z"
            fill="#facc15"
            stroke="#d97706"
            strokeWidth="1.5"
          />
        </g>
      </svg>
      <p className="mt-1 text-2xl font-black text-brand">{name}</p>
      <p className="text-sm font-extrabold uppercase tracking-widest text-amber-500">
        Champion
      </p>
    </div>
  );
}
