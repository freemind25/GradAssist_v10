"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { TeacherLogin } from "@/components/teacher-login";

/**
 * [SEC-04c] Page /auth/signup — inscription enseignant (voie 3 migration douce).
 *
 * URL accepte le paramètre ?email=prenom.nom@univ.dz pour pré-remplir le champ email
 * (utilisée par l'email J-3 envoyé aux enseignants connus).
 */

function SignupContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const prefillEmail = searchParams.get("email") ?? "";

  return (
    <TeacherLogin
      onLogin={() => router.push("/")}
      mode="signup-prefilled"
      prefillEmail={prefillEmail}
    />
  );
}

export default function SignupPage() {
  return (
    <Suspense fallback={<div>Chargement...</div>}>
      <SignupContent />
    </Suspense>
  );
}
