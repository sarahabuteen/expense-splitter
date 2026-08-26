/**
 * The ambient layer behind the hero: a fading grid, three slow-drifting pools
 * of colour, and a hairline that sweeps down once every nine seconds.
 *
 * Decorative and inert — `aria-hidden`, `pointer-events: none`, and pinned
 * behind everything on its own stacking context so it can never intercept a
 * click or a tab stop.
 *
 * The glows are radial gradients rather than blurred shapes. A gradient is
 * soft for free; `filter: blur()` on something this large would repaint a
 * full-viewport surface on every frame of the drift.
 */
export function Backdrop() {
  return (
    <div aria-hidden="true" className="lp-backdrop">
      <div className="lp-grid" />
      <div className="lp-orb lp-orb-1" />
      <div className="lp-orb lp-orb-2" />
      <div className="lp-orb lp-orb-3" />
      <div className="lp-scan" />
    </div>
  );
}
