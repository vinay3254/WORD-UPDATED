// EtherX Shield Logo — SVG recreation of the golden shield mark
export function EtherXLogo({ size = 28, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 110" fill="none"
      xmlns="http://www.w3.org/2000/svg" className={className}>
      {/* Outer shield */}
      <path d="M50 4 L90 20 L90 58 Q90 85 50 106 Q10 85 10 58 L10 20 Z"
        stroke="#d4af37" strokeWidth="4.5" fill="none"
        strokeLinejoin="round" strokeLinecap="round" />
      {/* Middle shield */}
      <path d="M50 18 L78 30 L78 58 Q78 76 50 92 Q22 76 22 58 L22 30 Z"
        stroke="#d4af37" strokeWidth="3.5" fill="none"
        strokeLinejoin="round" strokeLinecap="round" />
      {/* Inner shield / E mark */}
      <path d="M50 33 L66 41 L66 58 Q66 68 50 78 Q34 68 34 58 L34 41 Z"
        stroke="#d4af37" strokeWidth="2.8" fill="none"
        strokeLinejoin="round" strokeLinecap="round" />
      {/* Slash accent (top-right) */}
      <path d="M68 14 L82 10" stroke="#d4af37" strokeWidth="3" strokeLinecap="round" opacity=".6" />
      {/* Center dot */}
      <circle cx="50" cy="56" r="3.5" fill="#d4af37" opacity=".8" />
    </svg>
  );
}
