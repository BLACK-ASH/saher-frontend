"use client";

import { useMe } from "@/hooks/use-me";
import type { UserRole } from "@/lib/permissions";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

type Props = {
  children: React.ReactNode;
  allow: (role: UserRole) => boolean;
};

export default function RoleGuard({ children, allow }: Props) {
  const { data: user, isLoading } = useMe();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && user) {
      if (!allow(user.role)) {
        router.replace("/forbidden");
      }
    }

    if (!isLoading && !user) {
      router.replace("/login");
    }
  }, [user, isLoading, allow, router]);

  if (isLoading || !user) return null;

  return <>{children}</>;
}
