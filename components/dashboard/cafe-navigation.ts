import {
  Database,
  Gift,
  LayoutDashboard,
  Bell,
  Monitor,
  Settings,
  Smartphone,
  Users,
} from "lucide-react";

export const cafeNavigation = [
  {
    label: "Overview",
    mobileLabel: "Home",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    label: "Members",
    mobileLabel: "Members",
    href: "/dashboard/members",
    icon: Users,
  },
  {
    label: "Customers",
    adminOnly: true,
    mobileLabel: "Data",
    href: "/dashboard/customers",
    icon: Database,
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
  { label: "Rewards", mobileLabel: "Rewards", adminOnly: true, pointsOnly: true, href: "/dashboard/rewards", icon: Gift },
  {
    label: "Campaigns",
    adminOnly: true,
    mobileLabel: "Offers",
    href: "/dashboard/campaigns",
    icon: Bell,
  },
  {
    label: "Settings",
    adminOnly: true,
    mobileLabel: "Setup",
    href: "/dashboard/settings",
    icon: Settings,
  },
] as const;

export function isDashboardCurrentPage(
  pathname: string,
  href: string,
) {
  if (href === "/dashboard") {
    return pathname === href;
  }

  if (href === "/dashboard/scanner") {
    return pathname === href;
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}
