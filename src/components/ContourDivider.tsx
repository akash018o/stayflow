// Signature divider element referencing the valley's topography.
// Used between the hero and the room grid instead of a plain hairline.
export default function ContourDivider() {
  return (
    <svg
      viewBox="0 0 680 24"
      preserveAspectRatio="none"
      className="w-full h-6 block"
      aria-hidden="true"
    >
      <path
        d="M0,12 Q34,3 68,12 T136,12 T204,12 T272,12 T340,12 T408,12 T476,12 T544,12 T612,12 T680,12"
        fill="none"
        stroke="#0B6E5C"
        strokeWidth="1.25"
        opacity="0.45"
      />
      <path
        d="M0,17 Q34,8 68,17 T136,17 T204,17 T272,17 T340,17 T408,17 T476,17 T544,17 T612,17 T680,17"
        fill="none"
        stroke="#0B6E5C"
        strokeWidth="1.25"
        opacity="0.25"
      />
    </svg>
  )
}
