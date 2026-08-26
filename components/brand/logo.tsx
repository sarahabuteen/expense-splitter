/**
 * The mark: a git-style fork. One payment branching into the people sharing
 * it — which is literally what an expense split is.
 *
 * Stroke 2 on a 24 viewBox with round caps, matching the Lucide set the brand
 * kit recommends, so the logo and the icons read as one family. Drawn in
 * currentColor so it inherits text colour and costs no image request.
 */
export function Logo({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      <circle cx="6" cy="5.5" r="2.5" />
      <circle cx="18" cy="5.5" r="2.5" />
      <circle cx="12" cy="18.5" r="2.5" />
      <path d="M6 8v1.8a2.2 2.2 0 0 0 2.2 2.2h7.6A2.2 2.2 0 0 0 18 9.8V8" />
      <path d="M12 12v4" />
    </svg>
  );
}
