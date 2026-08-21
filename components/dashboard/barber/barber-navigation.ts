import {
  LayoutDashboard,
  Monitor,
  Settings,
  Smartphone,
  Users,
} from "lucide-react";

export const barberNavigation = [
  {
    label: "Overview",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    label: "Clients",
    href: "/dashboard/members",
    icon: Users,
  },
  {
    label: "USB Scanner",
    href: "/dashboard/scanner",
    icon: Monitor,
  },
  {
    label: "Phone Scanner",
    href: "/dashboard/scanner/phone",
    icon: Smartphone,
  },
  {
    label: "Settings",
    href: "/dashboard/settings",
    icon: Settings,
  },
] as const;
