"use client";

import { NoticeExpiryBadge } from "@/features/noticeboard/notice-expiry-badge";
import { useNotices } from "@/hooks/use-notice";
import { DefaultLoader } from "@/components/loading";
import { NoData } from "@/components/no-data";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatIstDate, formatIstDateTime } from "@/lib/date";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

// TODO: use GET /notice/:id when backend adds single-notice endpoint
export function NoticeDetail({ noticeId }: { noticeId: string }) {
  const router = useRouter();
  const { notices } = useNotices();

  const notice = (notices.data ?? []).find((n) => n._id === noticeId);

  if (notices.isLoading) {
    return <DefaultLoader className="min-h-[50vh]" />;
  }

  if (!notice) {
    return (
      <div className="p-4">
        <NoData
          title="Notice not found"
          description="This notice may have expired, been deleted, or never existed."
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-4 p-4">
      {/* Actions */}
      <Button variant="outline" onClick={() => router.back()}>
        <ArrowLeft />
        Back
      </Button>

      <Card>
        <CardHeader>
          <CardTitle className="text-xl font-bold">{notice.title}</CardTitle>
          <CardDescription>Created: {formatIstDateTime(notice.createdAt)}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="whitespace-pre-line">{notice.description}</p>
          {/* Info */}
          <div className="flex items-center gap-2 border-t pt-4 text-sm text-muted-foreground">
            <NoticeExpiryBadge expiresAt={notice.expiresAt} />
            <span>Expires: {formatIstDate(notice.expiresAt)}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
