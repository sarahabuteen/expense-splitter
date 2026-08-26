import { AppShell } from "@/components/layout/app-shell";
import { listGroups } from "@/lib/server/groups";

export default async function GroupsLayout({ children }: LayoutProps<"/groups">) {
  const groups = await listGroups();
  return <AppShell groups={groups}>{children}</AppShell>;
}
