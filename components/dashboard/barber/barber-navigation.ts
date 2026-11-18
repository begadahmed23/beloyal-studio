import {
  Database,
  LayoutDashboard,
  Bell,
  Monitor,
  Settings,
  Smartphone,
  Users,
} from "lucide-react";

export const barberNavigation = [
  {
    label: "Overview",
    mobileLabel: "Home",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    label: "Clients",
    mobileLabel: "Clients",
    href: "/dashboard/members",
    icon: Users,
  },
  {
    label: "Customers",
    mobileLabel: "Data",
    href: "/dashboard/customers",
    icon: Database,
    adminOnly: true,
  },
  {
    label: "USB Scanner",
    mobileLabel: "USB",
    desktopOnly: true,
    href: "/dashboard/scanner",
    icon: Monitor,
  },
  {
    label: "Phone Scanner",
    mobileLabel: "Scan",
    href: "/dashboard/scanner/phone",
    icon: Smartphone,
  },
  {
    label: "Campaigns",
    mobileLabel: "Offers",
    adminOnly: true,
    href: "/dashboard/campaigns",
    icon: Bell,
  },
  {
    label: "Settings",
    mobileLabel: "Setup",
    adminOnly: true,
    href: "/dashboard/settings",
    icon: Settings,
  },
] as const;
