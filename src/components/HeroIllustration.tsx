interface HeroIllustrationProps {
  className?: string
}

// Wider panorama version of the same view motif used per-room, standing
// in for the whole property rather than one room's outlook. Same flat
// layered style and palette as RoomIllustration, just bigger and busier.
export default function HeroIllustration({ className }: HeroIllustrationProps) {
  return (
    <svg viewBox="0 0 500 320" className={className} role="img" aria-label="Illustration of the homestay valley, river, and mountains">
      <rect width="500" height="320" fill="#EFE4CC" />
      <circle cx="410" cy="70" r="26" fill="#F2900C" />

      <path
        d="M0,190 L90,90 L160,180 L230,70 L300,180 L370,100 L440,180 L500,140 L500,320 L0,320 Z"
        fill="#C9AF7E"
        opacity="0.6"
      />
      <path
        d="M0,230 L100,150 L190,220 L280,130 L360,220 L440,160 L500,200 L500,320 L0,320 Z"
        fill="#8A6F45"
        opacity="0.65"
      />

      {/* Roofline hinting at the property itself, sitting in the valley */}
      <path d="M170,240 L215,205 L260,240 Z" fill="#241F1C" opacity="0.8" />
      <rect x="182" y="240" width="66" height="34" fill="#241F1C" opacity="0.8" />
      <rect x="205" y="252" width="18" height="22" fill="#F2900C" opacity="0.9" />

      <path
        d="M0,270 Q60,255 120,270 T240,270 T360,270 T500,265 L500,320 L0,320 Z"
        fill="#0B6E5C"
        opacity="0.9"
      />
    </svg>
  )
}
