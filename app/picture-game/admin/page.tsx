import { redirect } from "next/navigation";
import { isAdminRequest } from "@/lib/auth";
import PictureGameAdmin from "./PictureGameAdmin";

export default async function PictureGameAdminPage() {
  if (!(await isAdminRequest())) {
    redirect("/login?redirect=/picture-game/admin");
  }

  return <PictureGameAdmin />;
}
