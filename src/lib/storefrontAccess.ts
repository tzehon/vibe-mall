import { canViewStorefront, type AuthUser } from "./auth";
import type { Storefront } from "./models";

export type StorefrontPageAccess = "visible" | "login" | "hidden";

export function getStorefrontPageAccess(
  storefront: Pick<Storefront, "ownerId" | "status">,
  user: AuthUser | null
): StorefrontPageAccess {
  if (canViewStorefront(user?._id, storefront)) {
    return "visible";
  }

  return user ? "hidden" : "login";
}
