"use client";

import { NoticeCard } from "@/features/noticeboard/notice-card";
import { useNotices } from "@/hooks/use-notice";
import { useMe } from "@/hooks/use-me";
import { can } from "@/lib/permissions";
import { DefaultLoader } from "@/components/loading";
import { NoData } from "@/components/no-data";
import { PaginationFooter } from "@/components/shared/pagination-footer";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Bell } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import type { NoticeResponse } from "@/services/notice.api";

const PAGE_SIZE = 10;

export function NoticeFeed() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [deleteTarget, setDeleteTarget] = useState<NoticeResponse | null>(null);
  const { notices, removeNotice } = useNotices();
  const { data: user } = useMe();
  const canDelete = can(user?.role ?? "user", "delete", "notice");

  const items = notices.data ?? [];
  const totalPages = Math.ceil(items.length / PAGE_SIZE);
  const pageItems = items.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const canWrite = can(user?.role ?? "user", "write", "notice");

  // 🔥 auto-clamp when the list shrinks (e.g. after a delete)
  if (page > totalPages && totalPages > 0) {
    setPage(totalPages);
  }

  if (notices.isLoading) {
    return <DefaultLoader className="min-h-[50vh]" />;
  }

  return (
    <div className="space-y-4 p-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Noticeboard</h1>
        {canWrite && (
          <Button onClick={() => router.push("/noticeboard/new")}>
            <Bell />
            New Notice
          </Button>
        )}
      </div>

      {items.length === 0 ? (
        <NoData
          className="mt-6"
          title="No active notices"
          description="There are no notices to show right now. Check back later."
        />
      ) : (
        <>
          {/* Card grid */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {pageItems.map((notice) => (
              <NoticeCard
                key={notice.id}
                notice={notice}
                onDelete={canDelete ? () => setDeleteTarget(notice) : undefined}
              />
            ))}
          </div>

          {/* Pagination */}
          <div className="mt-6 flex justify-center">
            <PaginationFooter page={page} totalPages={totalPages} onPageChange={setPage} />
          </div>
        </>
      )}

      {/* Soft delete confirmation */}
      <Dialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Notice</DialogTitle>
          </DialogHeader>
          <p>Are you sure you want to delete &quot;{deleteTarget?.title}&quot;?</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={removeNotice.isPending}
              onClick={() =>
                  removeNotice.mutate(deleteTarget!.id, {
                  onSuccess: () => {
                    toast.success("Notice deleted");
                    setDeleteTarget(null);
                  },
                })
              }
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
