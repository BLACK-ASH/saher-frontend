"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useParams } from "next/navigation";

import { useWorkshops } from "@/hooks/use-workshops";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";

export default function WorkshopPage() {
  const { id } = useParams<{ id: string }>();

  const { workshop: ws } = useWorkshops({ id });

  const { data: workshop, isLoading } = ws;

  if (isLoading) {
    return (
      <main className="mx-auto max-w-5xl space-y-8 px-6 py-10">
        <Skeleton className="h-10 w-28" />

        <div className="space-y-4">
          <Skeleton className="h-6 w-36" />
          <Skeleton className="h-12 w-2/3" />
        </div>

        <Separator />

        <div className="space-y-4">
          {Array.from({ length: 10 }).map((_, i) => (
            <Skeleton key={i} className="h-5 w-full" />
          ))}
        </div>
      </main>
    );
  }

  if (!workshop) {
    return (
      <main className="flex min-h-[70vh] flex-col items-center justify-center space-y-6 text-center">
        <h1 className="text-4xl font-bold">Workshop Not Found</h1>

        <p className="text-muted-foreground">
          The workshop you are looking for does not exist.
        </p>

        <Button asChild>
          <Link href="/program">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Programs
          </Link>
        </Button>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <Button variant="ghost" asChild className="mb-8 -ml-4">
        <Link href="/program">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Link>
      </Button>

      <header className="space-y-5">
        <Badge variant="secondary" className="w-fit">
          {workshop.programId.title}
        </Badge>

        <h1 className="text-5xl font-bold tracking-tight">{workshop.title}</h1>
      </header>

      <Separator className="my-10" />

      <article
        className="
          prose
          prose-neutral
          dark:prose-invert
          max-w-none

          prose-headings:scroll-mt-24
          prose-headings:font-bold

          prose-p:text-base
          prose-p:leading-8

          prose-li:leading-8

          prose-img:rounded-xl
          prose-img:border

          prose-pre:rounded-xl

          prose-table:w-full
        "
        dangerouslySetInnerHTML={{
          __html: workshop.description,
        }}
      />
    </main>
  );
}
