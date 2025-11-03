import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { UserSidebar } from '@/components/home/user-sidebar';

export default function HomeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <UserSidebar />
      <SidebarInset>
        {children}
      </SidebarInset>
    </SidebarProvider>
  );
}
