"use client";

import RoleGuard from "@/components/role-guard";
import { can } from "@/lib/permissions";
import { BooksOfAccountTable } from "@/features/reimbursement/books-of-account";

export default function ReimbursementAccountPage() {
  return (
    <RoleGuard allow={(r) => can(r, "read", "preReimbursement")}>
      <div className="container space-y-6 py-8">
        <div>
          <h1 className="text-3xl font-bold">Books of Account</h1>
          <p className="text-muted-foreground">
            Organization ledger — money spent from the organization account.
          </p>
        </div>
        <BooksOfAccountTable />
      </div>
    </RoleGuard>
  );
}