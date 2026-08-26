import { NoticeEdit } from "@/features/noticeboard/notice-edit";

export default async function EditNoticePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <NoticeEdit noticeId={id} />;
}
