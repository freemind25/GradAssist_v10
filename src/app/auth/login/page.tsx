"use client";

import { useRouter } from "next/navigation";
import { TeacherLogin } from "@/components/teacher-login";

/**
 * [SEC-04c] Page /auth/login — page de connexion enseignant.
 *
 * Redirige vers / si login OK.
 */
export default function LoginPage() {
  const router = useRouter();
  return (
    <TeacherLogin
      onLogin={() => router.push("/")}
      mode="login"
    />
  );
}
