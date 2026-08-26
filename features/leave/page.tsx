"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";

import { Plus } from "lucide-react";

import { useLeave } from "@/hooks/use-leave";
import { LeaveT } from "@/services/leave.api";
import LeaveBalanceCard from "./leave-balance-card";
import LeaveTable from "./leave-table";
import ApplyLeaveDialog from "./apply-leave-dialog";

export default function LeavePage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const page = Number(searchParams.get("page") ?? "1");
  const limit = Number(searchParams.get("limit") ?? "10");

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editLeave, setEditLeave] = useState<LeaveT | undefined>();

  const { balance, applications } = useLeave({
    page,
    limit,
  });

  return (
    <div className="container space-y-8 py-8">
      {/* Header */}

      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Leave Management
          </h1>

          <p className="text-muted-foreground">
            Apply for leave and monitor your leave balance.
          </p>
        </div>

        <Button onClick={() => setDialogOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Apply Leave
        </Button>
      </div>

      {/* Balance */}

      <section className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold">Leave Balance</h2>

          <p className="text-sm text-muted-foreground">
            Remaining leave available for each leave category.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {balance.data &&
            Object.entries(balance.data.balance).map(([key, value]) => (
              <LeaveBalanceCard key={key} title={key} balance={value} />
            ))}
        </div>
      </section>

      {/* Applications */}

      <section className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold">My Leave Applications</h2>

          <p className="text-sm text-muted-foreground">
            History of all leave requests.
          </p>
        </div>

        <LeaveTable
          loading={applications.isLoading}
          data={applications.data?.items ?? []}
          onEdit={(leave) => setEditLeave(leave)}
          page={applications.data?.page}
          totalPages={applications.data?.totalPages}
          onPageChange={(p) => router.push(`/leave?page=${p}&limit=${limit}`)}
        />
      </section>

      <ApplyLeaveDialog
        open={dialogOpen || !!editLeave}
        onOpenChange={(open) => {
          setDialogOpen(open);

          if (!open) setEditLeave(undefined);
        }}
        leave={editLeave}
      />
    </div>
  );
}
