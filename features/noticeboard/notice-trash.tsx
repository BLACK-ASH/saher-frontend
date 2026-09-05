"use client";

import { useState } from "react";
import { RotateCcw, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { TrashTabPattern } from "@/components/shared/trash-tab-pattern";
import { DefaultLoader } from "@/components/loading";
import { NoData } from "@/components/no-data";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useNotices } from "@/hooks/use-notice";
import { formatIstDate } from "@/lib/date";
import type { NoticeResponse } from "@/services/notice.api";

export function NoticeTrash() {
  const { trashedNotices, restore, permanentRemove } = useNotices();
  const [restoreTarget, setRestoreTarget] = useState<NoticeResponse | null>(
    null,
  );
  const [deleteTarget, setDeleteTarget] = useState<NoticeResponse | null>(null);

  const items = trashedNotices.data ?? [];

  return (
    <TrashTabPattern
      title="Trash"
      description="Deleted notices can be restored here."
    >
      {trashedNotices.isLoading ? (
        <DefaultLoader className="min-h-[40vh]" />
      ) : items.length === 0 ? (
        <NoData
          title="No deleted notices"
          description="Deleted notices will appear here."
        />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Expiry</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((notice) => (
              <TableRow key={notice.id}>
                <TableCell className="max-w-[240px] truncate">
                  {notice.title}
                </TableCell>
                <TableCell>{formatIstDate(notice.expiresAt)}</TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setRestoreTarget(notice)}
                  >
                    <RotateCcw className="mr-2 h-4 w-4" />
                    Restore
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive"
                    onClick={() => setDeleteTarget(notice)}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete Permanently
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {/* Restore confirmation */}
      <AlertDialog
        open={!!restoreTarget}
        onOpenChange={(open) => !open && setRestoreTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Restore notice?</AlertDialogTitle>
          </AlertDialogHeader>
          <AlertDialogDescription>
            &quot;{restoreTarget?.title}&quot; will move back to active
            notices.
          </AlertDialogDescription>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={restore.isPending}
              onClick={() =>
                restore.mutate(restoreTarget!.id, {
                  onSuccess: () => {
                    toast.success("Notice restored");
                    setRestoreTarget(null);
                  },
                })
              }
            >
              Restore
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Permanent delete confirmation */}
      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Permanently delete notice?</AlertDialogTitle>
          </AlertDialogHeader>
          <AlertDialogDescription>
            This notice will be permanently removed. This action cannot be
            undone.
          </AlertDialogDescription>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={permanentRemove.isPending}
              onClick={() =>
                permanentRemove.mutate(deleteTarget!.id, {
                  onSuccess: () => {
                    toast.success("Notice permanently deleted");
                    setDeleteTarget(null);
                  },
                })
              }
            >
              Delete permanently
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </TrashTabPattern>
  );
}
