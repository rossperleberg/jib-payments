import { useLocation, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import {
  LayoutDashboard,
  Building2,
  Upload,
  Clock,
  DollarSign,
  Factory,
  History,
  Settings,
  ClipboardEdit,
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
} from "@/components/ui/sidebar";

interface DashboardData {
  actionItems: {
    needsAttention: number;
    duplicatePayments: number;
    paymentsWithCredits: number;
    entryTrackerPayments: number;
    billPayPayments: number;
  };
}

const menuItems = [
  {
    title: "Dashboard",
    url: "/",
    icon: LayoutDashboard,
  },
  {
    title: "Accounts",
    url: "/accounts",
    icon: Building2,
  },
  {
    title: "JIB Import",
    url: "/import",
    icon: Upload,
  },
  {
    title: "Pending Payments",
    url: "/payments",
    icon: Clock,
    badgeKey: "pendingPayments" as const,
  },
  {
    title: "Entry Tracker",
    url: "/entry-tracker",
    icon: ClipboardEdit,
    badgeKey: "entryTrackerPayments" as const,
  },
  {
    title: "Credits",
    url: "/credits",
    icon: DollarSign,
  },
  {
    title: "Operators",
    url: "/operators",
    icon: Factory,
  },
  {
    title: "Payment History",
    url: "/history",
    icon: History,
  },
  {
    title: "Settings",
    url: "/settings",
    icon: Settings,
  },
];

export function AppSidebar() {
  const [location] = useLocation();
  
  const { data: dashboardData } = useQuery<DashboardData>({
    queryKey: ["/api/dashboard"],
  });
  
  const pendingCount = dashboardData?.actionItems?.needsAttention || 0;
  const entryTrackerCount = dashboardData?.actionItems?.entryTrackerPayments || 0;
  const billPayCount = dashboardData?.actionItems?.billPayPayments || 0;
  const totalEntryCount = entryTrackerCount + billPayCount;

  return (
    <Sidebar>
      <SidebarHeader className="p-4 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary">
            <DollarSign className="h-5 w-5 text-primary-foreground" />
          </div>
          <div className="flex flex-col">
            <span className="font-semibold text-sidebar-foreground">JIB Pay</span>
            <span className="text-xs text-muted-foreground">Financial Ops v2.0</span>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent className="p-2">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => {
                const isActive = location === item.url || 
                  (item.url !== "/" && location.startsWith(item.url));
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      className="h-10"
                      data-testid={`nav-${item.title.toLowerCase().replace(/\s+/g, '-')}`}
                    >
                      <Link href={item.url}>
                        <item.icon className="h-4 w-4" />
                        <span className="flex-1">{item.title}</span>
                        {item.badgeKey === "pendingPayments" && pendingCount > 0 && (
                          <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive text-[10px] font-medium text-destructive-foreground">
                            {pendingCount}
                          </span>
                        )}
                        {item.badgeKey === "entryTrackerPayments" && totalEntryCount > 0 && (
                          <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-amber-500 text-[10px] font-medium text-white">
                            {totalEntryCount}
                          </span>
                        )}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="p-4 border-t border-sidebar-border">
        <div className="text-xs text-muted-foreground">
          Western State Bank Integration
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
