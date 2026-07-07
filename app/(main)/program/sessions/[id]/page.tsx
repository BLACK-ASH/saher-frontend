"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useSessions } from "@/hooks/use-sessions";
import {
  ArrowLeft,
  Calendar,
  Clock3,
  Clock4,
  Download,
  Mail,
  Users,
} from "lucide-react";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";

export default function SessionPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [selectedImage, setSelectedImage] = useState<{
    src: string;
    alt: string;
  } | null>(null);
  const { session } = useSessions({ id });

  if (session.isLoading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <p className="text-muted-foreground">Loading session...</p>
      </div>
    );
  }

  if (!session.data) {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center gap-4">
        <h1 className="text-3xl font-bold">Session not found</h1>

        <Button onClick={() => router.back()}>Back</Button>
      </div>
    );
  }

  const data = session.data;

  return (
    <main className="mx-auto max-w-7xl space-y-12">
      {/* Header */}
      <section className="space-y-8 border-b pb-10">
        <Button
          variant="ghost"
          className="gap-2 mt-6"
          onClick={() => router.back()}
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>

        <div className="space-y-4">
          <Badge>Session</Badge>

          <h1 className="text-5xl font-bold tracking-tight">{data.title}</h1>

          <div className="flex flex-wrap gap-3">
            <Button
              variant="secondary"
              onClick={() => router.push(`/program/${data.program.id}`)}
            >
              {data.program.title}
            </Button>

            <Button
              variant="outline"
              onClick={() => router.push(`/workshop/${data.workshop.id}`)}
            >
              {data.workshop.title}
            </Button>
          </div>
        </div>
      </section>

      {/* Session Information */}
      <section className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Date</CardTitle>
          </CardHeader>

          <CardContent className="flex items-center gap-3">
            <Calendar className="h-5 w-5 text-muted-foreground" />

            <div>
              <p className="font-medium">
                {new Date(data.date).toLocaleDateString(undefined, {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Starts</CardTitle>
          </CardHeader>

          <CardContent className="flex items-center gap-3">
            <Clock3 className="h-5 w-5 text-muted-foreground" />

            <span>
              {new Date(data.startTime).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Ends</CardTitle>
          </CardHeader>

          <CardContent className="flex items-center gap-3">
            <Clock4 className="h-5 w-5 text-muted-foreground" />

            <span>
              {new Date(data.endTime).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          </CardContent>
        </Card>
      </section>

      {/* Description */}
      <section className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold">About this Session</h2>

          <p className="text-muted-foreground">
            Session description and agenda.
          </p>
        </div>

        <article
          className="
            prose
            prose-neutral
            dark:prose-invert
            max-w-none
            prose-headings:font-bold
            prose-img:rounded-xl
            prose-pre:rounded-xl
          "
          dangerouslySetInnerHTML={{
            __html: data.description,
          }}
        />
      </section>

      <section className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold">Session Review</h2>

          <p className="text-muted-foreground">
            Summary and observations after the session.
          </p>
        </div>

        <article
          className="
        prose
        prose-neutral
        dark:prose-invert
        max-w-none
        prose-img:rounded-xl
        prose-pre:rounded-xl
      "
          dangerouslySetInnerHTML={{
            __html: data?.review as string,
          }}
        />
      </section>
      {/* Speakers */}
      <section className="space-y-8">
        <div>
          <h2 className="text-3xl font-bold">Speakers</h2>

          <p className="text-muted-foreground">
            Session presenters and instructors.
          </p>
        </div>

        {data.speaker.length ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {data.speaker.map((speaker) => (
              <Card
                key={speaker.id}
                className="cursor-pointer transition hover:border-primary hover:shadow-md"
              >
                <CardContent className="flex flex-col items-center p-6 text-center">
                  <Avatar className="h-24 w-24">
                    <AvatarImage src={speaker.image.src} />
                    <AvatarFallback>
                      {speaker.name.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>

                  <CardTitle className="mt-5">{speaker.displayName}</CardTitle>

                  <CardDescription>@{speaker.name}</CardDescription>

                  <Badge className="mt-4" variant="secondary">
                    {speaker.role}
                  </Badge>

                  <div className="mt-5 flex items-center gap-2 text-sm text-muted-foreground">
                    <Mail className="h-4 w-4" />
                    <span className="truncate">{speaker.email}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed py-16 text-center">
            <Users className="mx-auto mb-4 h-10 w-10 text-muted-foreground" />

            <h3 className="font-semibold">No speakers assigned</h3>

            <p className="mt-2 text-sm text-muted-foreground">
              Speakers will appear here once assigned.
            </p>
          </div>
        )}
      </section>
      <section className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold">Gallery</h2>
          <p className="text-muted-foreground">
            Photos captured during this session.
          </p>
        </div>

        {data.images.length ? (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
            {data.images.map((image) => (
              <button
                key={image.id}
                type="button"
                className="group relative aspect-square overflow-hidden rounded-xl border"
                onClick={() =>
                  setSelectedImage({
                    src: image.src,
                    alt: image.alt,
                  })
                }
              >
                <Image
                  src={image.src}
                  alt={image.alt}
                  fill
                  className="object-cover transition group-hover:scale-105"
                />
              </button>
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed py-16 text-center text-muted-foreground">
            No session images uploaded.
          </div>
        )}
      </section>
      <section className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold">Participants</h2>

          <p className="text-muted-foreground">
            Participants who attended this session.
          </p>
        </div>

        {data.participants?.length ? (
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Gender</TableHead>
                  <TableHead className="text-right">Age</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {data.participants.map((participant) => (
                  <TableRow
                    key={participant.id}
                    className="cursor-pointer"
                    onClick={() =>
                      router.push(`/program/participants/${participant.id}`)
                    }
                  >
                    <TableCell className="font-medium">
                      {participant.name}
                    </TableCell>

                    <TableCell>{participant.gender ?? "-"}</TableCell>

                    <TableCell className="text-right">
                      {participant.age ?? "-"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        ) : (
          <div className="rounded-xl border border-dashed py-16 text-center text-muted-foreground">
            No participants found.
          </div>
        )}
      </section>
      <Dialog
        open={!!selectedImage}
        onOpenChange={(open) => {
          if (!open) setSelectedImage(null);
        }}
      >
        <DialogContent className="max-w-[95vw] border-none md:min-w-2/3 shadow-none p-4">
          {selectedImage && (
            <div className="relative flex max-h-[90vh] flex-col items-center">
              <div className="relative h-[80vh] w-full">
                <Image
                  src={selectedImage.src}
                  alt={selectedImage.alt}
                  fill
                  className="object-contain"
                />
              </div>

              <div className="mt-4 flex gap-3">
                <Button variant={"outline"} asChild>
                  <a
                    href={selectedImage.src}
                    download
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Download
                  </a>
                </Button>

                <Button
                  variant="destructive"
                  onClick={() => setSelectedImage(null)}
                >
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </main>
  );
}
