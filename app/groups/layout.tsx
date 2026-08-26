import { AppShell } from "@/components/layout/app-shell";
import { MOCK_GROUPS } from "@/lib/mock/groups";

export default function GroupsLayout({ children }: LayoutProps<"/groups">) {
  // UI only — swap for the server data layer when it exists.
  return <AppShell groups={MOCK_GROUPS}>{children}</AppShell>;
}
