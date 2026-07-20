import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { isValidAuthCookie, AUTH_COOKIE } from "@/lib/auth";
import PictureGameAdmin from "./PictureGameAdmin";

export default async function PictureGameAdminPage() {
  const cookieStore = await cookies();
  const authCookie = cookieStore.get(AUTH_COOKIE);
  if (!isValidAuthCookie(authCookie?.value)) {
    redirect("/login?redirect=/picture-game/admin");
  }

  return <PictureGameAdmin />;
}
