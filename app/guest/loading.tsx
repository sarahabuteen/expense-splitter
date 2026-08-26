import { GroupSkeleton } from "@/components/groups/group-skeleton";

/**
 * /guest renders the same dashboard as /groups/[groupId], so it needs the same
 * loading boundary. Without this file the segment has none, and the guest
 * landing page waits on a blank screen instead of the skeleton.
 */
export default function LoadingGuest() {
  return <GroupSkeleton />;
}
