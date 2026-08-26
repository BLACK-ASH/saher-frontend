import { NoticeDetail } from "@/features/noticeboard/notice-detail";

export default async function NoticeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <NoticeDetail noticeId={id} />;
}
