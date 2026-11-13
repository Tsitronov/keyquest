import { useId } from "react";

export type KeyPhase = "away" | "in" | "turn";

interface Props {
  /** 0 = closed, 1 = fully open. Animated with CSS. */
  open: number;
  keyPhase?: KeyPhase;
  state?: "done" | "current" | "future";
  /** Emoji shown in the light behind the open door. */
  behindIcon?: string;
  behindPhoto?: string;
  /** Door number painted above the arch. */
  num?: number;
  className?: string;
}

/**
 * A single hand-drawn door. Everything is SVG + CSS so it scales to any size
 * and needs no image files. The key lives inside the same SVG so it can slide
 * into the real keyhole.
 */
export function Door({
  open,
  keyPhase = "away",
  state = "future",
  behindIcon,
  behindPhoto,
  num,
  className = "",
}: Props) {
  const id = useId().replace(/:/g, "");
  const arch = "M28 300 V112 A72 72 0 0 1 172 112 V300 Z";
  return (
    <svg
      viewBox="0 0 200 300"
      className={`door door-${state} ${open > 0.5 ? "is-open" : ""} ${className}`}
      style={{ ["--open" as string]: open } as React.CSSProperties}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={`wood-${id}`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#b9773a" />
          <stop offset="0.55" stopColor="#d79a55" />
          <stop offset="1" stopColor="#a6672f" />
        </linearGradient>
        <linearGradient id={`stone-${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#8fa3b8" />
          <stop offset="1" stopColor="#6b7f95" />
        </linearGradient>
        <radialGradient id={`light-${id}`} cx="0.5" cy="0.55" r="0.75">
          <stop offset="0" stopColor="#fff7c2" />
          <stop offset="0.6" stopColor="#ffd97a" />
          <stop offset="1" stopColor="#f2a65a" />
        </radialGradient>
        <linearGradient id={`gold-${id}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#fff0a8" />
          <stop offset="1" stopColor="#e0a526" />
        </linearGradient>
      </defs>

      {/* stone frame */}
      <path d="M10 300 V110 A90 90 0 0 1 190 110 V300 Z" fill={`url(#stone-${id})`} />
      <path d="M10 300 V110 A90 90 0 0 1 190 110 V300" fill="none" stroke="#5c6e82" strokeWidth="3" />

      {/* the room behind the door */}
      <path d={arch} fill={`url(#light-${id})`} />
      <g className="behind">
        {behindPhoto ? (
          <image href={behindPhoto} x="52" y="120" width="96" height="96" preserveAspectRatio="xMidYMid slice" />
        ) : (
          <text x="100" y="200" textAnchor="middle" fontSize="78">
            {behindIcon}
          </text>
        )}
        <g transform="translate(138 238)">
          <circle r="16" fill="#3fae6a" stroke="#fff" strokeWidth="3" />
          <path d="M-7 0 L-2 6 L8 -6" fill="none" stroke="#fff" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
        </g>
      </g>

      {/* the door itself, hinged on the left */}
      <g className="panel">
        <path d={arch} fill={`url(#wood-${id})`} />
        <path d={arch} fill="none" stroke="#7a4a1d" strokeWidth="3" />
        <rect x="48" y="118" width="104" height="64" rx="12" fill="none" stroke="#8a5524" strokeWidth="3" />
        <rect x="48" y="200" width="104" height="80" rx="12" fill="none" stroke="#8a5524" strokeWidth="3" />
        <circle cx="150" cy="190" r="12" fill={`url(#gold-${id})`} stroke="#b9831a" strokeWidth="2" />
        <circle cx="150" cy="187" r="3.6" fill="#3a2410" />
        <path d="M148 188 L152 188 L153.2 197 L146.8 197 Z" fill="#3a2410" />
        <circle cx="70" cy="232" r="7" fill={`url(#gold-${id})`} stroke="#b9831a" strokeWidth="2" />
      </g>

      {/* number plate */}
      {num !== undefined && (
        <g>
          <circle cx="100" cy="28" r="17" fill="#ffd166" stroke="#fff" strokeWidth="3" />
          <text x="100" y="35" textAnchor="middle" fontSize="22" fontWeight="800" fill="#2b3a55">
            {num}
          </text>
        </g>
      )}

      {/* the key */}
      <g className="key" data-phase={keyPhase}>
        <circle cx="52" cy="0" r="13" fill="none" stroke={`url(#gold-${id})`} strokeWidth="7" />
        <rect x="-2" y="-3.5" width="54" height="7" rx="3" fill={`url(#gold-${id})`} />
        <rect x="6" y="3" width="6" height="10" rx="2" fill={`url(#gold-${id})`} />
        <rect x="17" y="3" width="6" height="7" rx="2" fill={`url(#gold-${id})`} />
      </g>
    </svg>
  );
}
