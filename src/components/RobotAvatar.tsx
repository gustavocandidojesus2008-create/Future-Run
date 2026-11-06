import type { AvatarId } from '@/types';

interface Props {
  id: AvatarId;
  size?: number;
  className?: string;
  animated?: boolean;
}

const COLORS: Record<AvatarId, { body: string; accent: string; eye: string; glow: string }> = {
  'robo-pink': { body: '#ff2d9c', accent: '#ff6bb8', eye: '#fff', glow: 'rgba(255,45,156,0.5)' },
  'robo-cyan': { body: '#00c8ff', accent: '#5ce8ff', eye: '#fff', glow: 'rgba(0,200,255,0.5)' },
  'robo-gold': { body: '#ffd700', accent: '#ffe566', eye: '#1a1a2e', glow: 'rgba(255,215,0,0.5)' },
  'robo-violet': { body: '#b366ff', accent: '#cc99ff', eye: '#fff', glow: 'rgba(179,102,255,0.5)' },
  'robo-lime': { body: '#aaff00', accent: '#ccff66', eye: '#1a1a2e', glow: 'rgba(170,255,0,0.5)' },
};

export default function RobotAvatar({ id, size = 80, className = '', animated = false }: Props) {
  const c = COLORS[id];
  const uid = `avatar-${id}`;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      className={className}
      style={animated ? { animation: 'float 3s ease-in-out infinite' } : undefined}
    >
      <defs>
        <radialGradient id={`${uid}-grad`} cx="40%" cy="35%">
          <stop offset="0%" stopColor={c.accent} />
          <stop offset="100%" stopColor={c.body} />
        </radialGradient>
        <filter id={`${uid}-glow`}>
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Antenna */}
      <line x1="50" y1="12" x2="50" y2="25" stroke={c.accent} strokeWidth="2.5" strokeLinecap="round" />
      <circle cx="50" cy="10" r="4" fill={c.accent} filter={`url(#${uid}-glow)`}>
        {animated && <animate attributeName="opacity" values="1;0.4;1" dur="1.5s" repeatCount="indefinite" />}
      </circle>

      {/* Head */}
      <rect x="28" y="25" width="44" height="36" rx="10" fill={`url(#${uid}-grad)`} stroke={c.accent} strokeWidth="1.5" filter={`url(#${uid}-glow)`} />

      {/* Eyes */}
      <rect x="37" y="35" width="10" height="8" rx="3" fill="#0a0a14" />
      <rect x="53" y="35" width="10" height="8" rx="3" fill="#0a0a14" />
      <rect x="39" y="37" width="4" height="3" rx="1.5" fill={c.eye} />
      <rect x="55" y="37" width="4" height="3" rx="1.5" fill={c.eye} />
      {animated && (
        <>
          <animate xlinkHref="" attributeName="x" values="39;40;39" dur="3s" repeatCount="indefinite" />
        </>
      )}

      {/* Mouth */}
      <rect x="40" y="50" width="20" height="4" rx="2" fill="#0a0a14" opacity="0.6" />

      {/* Neck */}
      <rect x="46" y="61" width="8" height="5" fill={c.body} opacity="0.7" />

      {/* Body */}
      <rect x="25" y="66" width="50" height="28" rx="8" fill={`url(#${uid}-grad)`} stroke={c.accent} strokeWidth="1.5" filter={`url(#${uid}-glow)`} />

      {/* Chest light */}
      <circle cx="50" cy="80" r="6" fill={c.accent} filter={`url(#${uid}-glow)`}>
        {animated && <animate attributeName="opacity" values="1;0.3;1" dur="2s" repeatCount="indefinite" />}
      </circle>
      <circle cx="50" cy="80" r="3" fill="#fff" opacity="0.8" />

      {/* Side details */}
      <rect x="30" y="72" width="4" height="4" rx="1" fill="#0a0a14" opacity="0.3" />
      <rect x="66" y="72" width="4" height="4" rx="1" fill="#0a0a14" opacity="0.3" />
    </svg>
  );
}
