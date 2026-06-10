import { ChangePasswordForm } from "@/features/change-password/components/change-password-form";
import { Suspense } from "react";

export default function Page() {
  return (
    <Suspense>
      <ChangePasswordForm />
    </Suspense>
  );
}
