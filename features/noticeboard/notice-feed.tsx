"use client";

import { NoticeCard } from "@/features/noticeboard/notice-card";
import { useNotices } from "@/hooks/use-notice";
import { useMe } from "@/hooks/use-me";
import { can } from "@/lib/permissions";
import { DefaultLoader } from "@/components/loading";
import { NoData } from "@/components/no-data";
import { PaginationFooter } from "@/components/pagination-footer";
import { Button } from "@/components/ui/button";
import { Bell } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

const PAGE_SIZE = 10;

export function NoticeFeed() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const { notices } = useNotices();
  const { data: user } = useMe();

  const items = notices.data ?? [];
  const totalPages = Math.ceil(items.length / PAGE_SIZE);
  const pageItems = items.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // 🔥 auto-clamp when the list shrinks (e.g. after a delete)
  if (page > totalPages && totalPages > 0) {
    setPage(totalPages);
  }

  if (notices.isLoading) {
    return <DefaultLoader className="min-h-[50vh]" />;
  }

  if (items.length === 0) {
    return (
      <div className="p-4">
        <h1 className="text-2xl font-bold">Noticeboard</h1>
        <NoData
          className="mt-6"
          title="No active notices"
          description="There are no notices to show right now. Check back later."
        />
      </div>
    );
  }

  return (
    <div className="space-y-4 p-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Noticeboard</h1>
        {can(user?.role ?? "user", "write", "notice") && (
          <Button onClick={() => router.push("/noticeboard/new")}>
            <Bell />
            New Notice
          </Button>
        )}
      </div>

      {/* Card grid */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {pageItems.map((notice) => (
          <NoticeCard key={notice._id} notice={notice} />
        ))}
      </div>

      {/* Pagination */}
      <div className="mt-6 flex justify-center">
        <PaginationFooter page={page} totalPages={totalPages} onPageChange={setPage} />
      </div>
    </div>
  );
}
