"use client";

import { NoticeForm } from "@/features/noticeboard/notice-form";
import { useNotices } from "@/hooks/use-notice";
import { DefaultLoader } from "@/components/loading";
import { NoData } from "@/components/no-data";

export function NoticeEdit({ noticeId }: { noticeId: string }) {
  // No GET /notice/:id endpoint — resolved from the cached active list.
  const { notices } = useNotices();

  if (notices.isLoading) {
    return <DefaultLoader className="min-h-[50vh]" />;
  }

  const n = (notices.data ?? []).find((x) => x.id === noticeId);

  if (!n) {
    return (
      <div className="p-4">
        <NoData
          title="Notice not found"
          description="This notice may have been deleted or expired."
        />
      </div>
    );
  }

  return (
    <div className="p-4">
      <h1 className="mb-5 text-2xl font-bold">Edit Notice</h1>
      <NoticeForm
        mode="edit"
        initialData={{
          id: n.id,
          title: n.title,
          description: n.description,
          expiresAt: n.expiresAt,
        }}
      />
    </div>
  );
}
