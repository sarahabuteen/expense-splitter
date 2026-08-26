/**
 * Decorative page wash. Much subtler than the auth screens' backdrop — those
 * hold one small card, these hold dense content, and a busy background behind a
 * column of figures is noise rather than life.
 *
 * A single top-anchored brand wash plus a hairline fade, in CSS only.
 */
export function PageBackdrop() {
  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10">
      <div
        className="absolute inset-x-0 top-0 h-[32rem] opacity-70"
        style={{
          background:
            "radial-gradient(52rem 26rem at 50% -8%, var(--accent-subtle), transparent 70%)",
        }}
      />
    </div>
  );
}
