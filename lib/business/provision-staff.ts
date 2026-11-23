import { prisma } from "@/lib/prisma";
import { provisioningAuth } from "@/lib/provisioning-auth";
import { getCashierLocation, withStoreCapacity } from "./store-capacity";

export async function provisionStaff({ cafeId, name, email, password, role, locationId }: {
  cafeId: string;
  name: string;
  email: string;
  password: string;
  role: "CAFE_ADMIN" | "CASHIER";
  locationId: string;
}) {
  if (role === "CASHIER") {
    await withStoreCapacity(cafeId, (tx, limit) => getCashierLocation(tx, cafeId, limit, locationId));
  }

  const signup = await provisioningAuth.api.signUpEmail({ body: { name, email, password } });
  if (!signup.user) throw new Error("Account was not created.");
  const { id } = signup.user;

  try {
    return await withStoreCapacity(cafeId, async (tx, limit) => {
      // Recheck after signup, because another request may have filled the last slot.
      const cashierLocationId = role === "CASHIER"
        ? await getCashierLocation(tx, cafeId, limit, locationId)
        : null;
      return tx.user.update({
        where: { id },
        data: { role, staffCafeId: cafeId, cafeId: null, cashierCafeId: null, cashierLocationId, isEnabled: true },
        select: { id: true, name: true, email: true, role: true, isEnabled: true, createdAt: true },
      });
    });
  } catch (error) {
    await prisma.user.deleteMany({ where: { id, cafeId: null, cashierCafeId: null, staffCafeId: null } });
    throw error;
  }
}
