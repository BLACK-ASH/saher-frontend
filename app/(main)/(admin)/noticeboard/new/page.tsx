import { Suspense } from "react";
import { NoticeForm } from "@/features/noticeboard/notice-form";
import { DefaultLoader } from "@/components/loading";

export default function NewNoticePage() {
  return (
    <div className="p-4">
      <h1 className="mb-5 text-2xl font-bold">New Notice</h1>
      <Suspense fallback={<DefaultLoader />}>
        <NoticeForm mode="create" />
      </Suspense>
    </div>
  );
}
