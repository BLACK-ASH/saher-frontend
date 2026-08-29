"use client";

import { ArrowLeft, CalendarDays } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

import { useWorkshops } from "@/hooks/use-workshops";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

export default function WorkshopPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
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
      <div className="flex min-h-[70vh] flex-col items-center justify-center gap-4">
        <h1 className="text-3xl font-bold">Workshop not found</h1>

        <Button onClick={() => router.back()}>Go Back</Button>
      </div>
    );
  }

  return (
    <main className="mx-auto max-w-7xl space-y-12 p-4 py-10">
      <Button
        className="flex gap-2 items-center mb-6"
        onClick={() => router.back()}
        variant={"ghost"}
      >
        <ArrowLeft /> Back
      </Button>

      <Breadcrumb className="mb-8">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/program">Programs</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href={`/program/workshops?keyword=${workshop.program.id}`}>
                {workshop.program.title}
              </Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{workshop.title}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <header className="space-y-5">
        <Badge variant="secondary" className="w-fit">
          {workshop.program.title}
        </Badge>

        <h1 className="text-5xl font-bold tracking-tight">{workshop.title}</h1>
      </header>

      <div className="flex flex-wrap gap-3">
        <Button asChild variant="outline">
          <Link href={`/program/sessions?keyword=${workshop.id}`}>
            <CalendarDays className="mr-2 h-4 w-4" />
            Sessions
          </Link>
        </Button>
      </div>

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
