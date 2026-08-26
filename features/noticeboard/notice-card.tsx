"use client";

import { NoticeExpiryBadge } from "@/features/noticeboard/notice-expiry-badge";
import { formatIstDate } from "@/lib/date";
import type { NoticeResponse } from "@/services/notice.api";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function NoticeCard({ notice }: { notice: NoticeResponse }) {
  const router = useRouter();

  const excerpt =
    notice.description.length > 150
      ? `${notice.description.slice(0, 150)}...`
      : notice.description;

  return (
    <Card
      className="cursor-pointer transition-all hover:border-primary hover:shadow-md"
      onClick={() => router.push(`/noticeboard/${notice._id}`)}
    >
      <CardHeader>
        <CardTitle>{notice.title}</CardTitle>
        <CardDescription>Created: {formatIstDate(notice.createdAt)}</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="whitespace-pre-line text-sm">{excerpt}</p>
      </CardContent>
      <CardFooter className="justify-between">
        <NoticeExpiryBadge expiresAt={notice.expiresAt} />
        <span className={cn("text-muted-foreground text-sm")}>
          Expires: {formatIstDate(notice.expiresAt)}
        </span>
      </CardFooter>
    </Card>
  );
}
