import { VerifyEmailForm } from "@/features/verify-email/components/verify-email-form";
import { Suspense } from "react";

export default function Page() {
  return (
    <Suspense>
      <VerifyEmailForm />
    </Suspense>
  );
}
