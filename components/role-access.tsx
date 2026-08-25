"use client";

import { ReactNode } from "react";
import { useMe } from "@/hooks/use-me";
import type { UserRole } from "@/lib/permissions";

type RoleAccessProps = {
  children: ReactNode;
  allow: (role: UserRole) => boolean;
  fallback?: ReactNode;
  loading?: ReactNode;
};

const RoleAccess = ({
  children,
  allow,
  fallback = null,
  loading = null,
}: RoleAccessProps) => {
  const { data: user, isLoading } = useMe();

  if (isLoading) {
    return <>{loading}</>;
  }

  if (!user || !allow(user.role)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};

export default RoleAccess;
