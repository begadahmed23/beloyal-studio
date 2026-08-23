import {
  LayoutDashboard,
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
    label: "USB Scanner",
    mobileLabel: "USB",
    href: "/dashboard/scanner",
    icon: Monitor,
  },
  {
    label: "Phone Scanner",
    mobileLabel: "Phone",
    href: "/dashboard/scanner/phone",
    icon: Smartphone,
  },
  {
    label: "Settings",
    mobileLabel: "Settings",
    href: "/dashboard/settings",
    icon: Settings,
  },
] as const;

export function isCafeCurrentPage(
  pathname: string,
  href: string,
) {
  if (href === "/dashboard") {
    return pathname === href;
  }

  if (href === "/dashboard/scanner") {
    return pathname === href;
  }

  return pathname.startsWith(href);
}
