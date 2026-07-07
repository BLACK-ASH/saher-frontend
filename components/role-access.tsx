"use client";

import { ReactNode } from "react";
import { useMe } from "@/hooks/use-me";

type Role = "admin" | "manager" | "user";

type RoleAccessProps = {
  children: ReactNode;
  roles: Role[];
  fallback?: ReactNode;
  loading?: ReactNode;
};

const RoleAccess = ({
  children,
  roles,
  fallback = null,
  loading = null,
}: RoleAccessProps) => {
  const { data: user, isLoading } = useMe();

  if (isLoading) {
    return <>{loading}</>;
  }

  if (!user || !roles.includes(user.role)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};

export default RoleAccess;
