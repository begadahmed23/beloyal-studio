import type { ReactNode } from "react";

import BirthdayRedemptionConfetti from "./components/BirthdayRedemptionConfetti";

type Props = {
  children: ReactNode;
};

export default function CustomerCardLayout({ children }: Props) {
  return (
    <>
      {children}
      <BirthdayRedemptionConfetti />
    </>
  );
}
