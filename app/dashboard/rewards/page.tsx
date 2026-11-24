import { redirect } from "next/navigation";

export default function RewardsPage() {
  redirect("/dashboard/settings#loyalty-program");
}
