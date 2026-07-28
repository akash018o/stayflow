interface RoomIllustrationProps {
  variant: 'river' | 'mountain' | 'valley'
  className?: string
}

// Stand-in for real property photos. Same "view" motif per room type,
// varied by what that room actually looks out on. Swap for real photos
// once there's an actual property to shoot (Phase 5+).
export default function RoomIllustration({ variant, className }: RoomIllustrationProps) {
  return (
    <svg
      viewBox="0 0 400 220"
      className={className}
      role="img"
      aria-label={`${variant} view illustration`}
    >
      <rect width="400" height="220" fill="#EFE4CC" />
      {variant === 'river' && (
        <>
          <path d="M0,140 L60,90 L120,130 L180,70 L240,120 L300,80 L360,120 L400,100 L400,220 L0,220 Z" fill="#C9AF7E" opacity="0.6" />
          <path d="M0,170 L80,120 L160,160 L240,110 L320,150 L400,130 L400,220 L0,220 Z" fill="#8A6F45" opacity="0.65" />
          <path d="M0,190 Q50,180 100,190 T200,190 T300,190 T400,190 L400,220 L0,220 Z" fill="#0B6E5C" opacity="0.9" />
          <circle cx="330" cy="50" r="18" fill="#F2900C" />
        </>
      )}
      {variant === 'mountain' && (
        <>
          <path d="M0,160 L70,60 L130,150 L190,50 L260,160 L330,70 L400,150 L400,220 L0,220 Z" fill="#B99A63" opacity="0.65" />
          <path d="M0,190 L90,120 L170,190 L250,110 L340,190 L400,160 L400,220 L0,220 Z" fill="#6B5535" opacity="0.65" />
          <circle cx="70" cy="45" r="16" fill="#F2900C" />
        </>
      )}
      {variant === 'valley' && (
        <>
          <path d="M0,150 Q100,100 200,145 T400,140 L400,220 L0,220 Z" fill="#C9AF7E" opacity="0.6" />
          <path d="M0,180 Q120,140 240,175 T400,170 L400,220 L0,220 Z" fill="#8A6F45" opacity="0.6" />
          <circle cx="310" cy="55" r="22" fill="#F2900C" />
        </>
      )}
    </svg>
  )
}
