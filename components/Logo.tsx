// SmartAttend logo (user's Canva design): blue glowing rounded tile with a mortarboard and a check mark.
// Default = the emblem only (square, for headers/icons). `full` = the tile with the "SmartAttend" wordmark and tagline.
export default function Logo({ size = 32, full = false }: { size?: number; full?: boolean }) {
  if (full) {
    // logo-full.png is 520x570
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src="/logo-full.png" width={size} height={Math.round((size * 570) / 520)} alt="SmartAttend" className="mx-auto block shrink-0" />
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src="/icon-192.png" width={size} height={size} alt="" aria-hidden="true" className="shrink-0" />
  );
}
