import { Workspace } from "@/components/layout/workspace";

export default function GuestLayout({ children }: LayoutProps<"/guest">) {
  return <Workspace>{children}</Workspace>;
}
