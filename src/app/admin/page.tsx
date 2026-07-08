import { redirect } from "next/navigation";
import { isAuthenticated } from "@/lib/auth";
import LoginClient from "./LoginClient";

export default function AdminPage() {
  if (isAuthenticated()) redirect("/admin/dashboard");
  return <LoginClient />;
}
