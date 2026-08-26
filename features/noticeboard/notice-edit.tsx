"use client";

import { NoticeForm } from "@/features/noticeboard/notice-form";
import { useNotices } from "@/hooks/use-notice";
import { DefaultLoader } from "@/components/loading";
import { NoData } from "@/components/no-data";

export function NoticeEdit({ noticeId }: { noticeId: string }) {
  // No GET /notice/:id endpoint — resolved from the cached list.
  const { notice } = useNotices({ id: noticeId });

  if (notice.isLoading) {
    return <DefaultLoader className="min-h-[50vh]" />;
  }

  if (!notice.data) {
    return (
      <div className="p-4">
        <NoData
          title="Notice not found"
          description="This notice may have been deleted or expired."
        />
      </div>
    );
  }

  const n = notice.data;

  return (
    <div className="p-4">
      <h1 className="mb-5 text-2xl font-bold">Edit Notice</h1>
      <NoticeForm
        mode="edit"
        initialData={{
          id: n._id,
          title: n.title,
          description: n.description,
          expiresAt: n.expiresAt,
        }}
      />
    </div>
  );
}
