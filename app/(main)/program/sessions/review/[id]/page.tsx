"use client";

import ImageUpload from "@/components/image-upload";
import TiptapEditor from "@/components/tiptap/editor";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useSessions } from "@/hooks/use-sessions";
import { ArrowLeft, ImageIcon, Loader2, Trash2 } from "lucide-react";
import { formatIstDate } from "@/lib/date";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export default function SessionReportPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const { session, update } = useSessions({ id });

  const [report, setReport] = useState("");
  const [images, setImages] = useState<
    { id: string; src: string; alt: string }[]
  >([]);

  useEffect(() => {
    if (!session.data) return;

    // ponytail: sync fetched server data into editable draft state; derive-on-render
    // refactor deferred until this screen is reworked
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setReport(session.data.review ?? "");

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setImages(
      (session.data.images ?? []).map((image) => ({
        id: image.id,
        src: image.src,
        alt: image.alt,
      })),
    );
  }, [session.data]);

  if (session.isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        Loading session...
      </div>
    );
  }

  if (!session.data) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
        <h2 className="text-2xl font-bold">Session not found</h2>

        <Button onClick={() => router.back()}>Go Back</Button>
      </div>
    );
  }

  const data = session.data;

  const handleSubmit = () => {
    update.mutate(
      {
        id: data.id,
        data: {
          review: report,
          images: images.map((image) => image.id),
        },
      },
      {
        onSuccess: () => {
          toast.success("Session report saved successfully.");
          router.push(`/program/sessions/${data.id}`);
        },
      },
    );
  };

  return (
    <main className="mx-auto max-w-7xl space-y-12 pb-8 p-4">
      <div className="space-y-4">
        <Button
          variant="ghost"
          className="gap-2 my-6"
          onClick={() => router.back()}
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>

        <div>
          <h1 className="text-4xl font-bold tracking-tight">Session Report</h1>

          <p className="mt-2 text-muted-foreground">
            Write a detailed report describing what happened during the session
            and upload photographs captured during the event.
          </p>
        </div>

        <Card>
          <CardContent className="flex flex-col gap-2 p-6 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-xl font-semibold">{data.title}</h2>

              <p className="text-sm text-muted-foreground">
                {data.program.title} • {data.workshop.title}
              </p>
            </div>

            <Badge variant="secondary">
              {formatIstDate(data.date)}
            </Badge>
          </CardContent>
        </Card>
      </div>

      <Separator />

      <section className="space-y-4">
        <div>
          <h2 className="text-2xl font-semibold">Session Report</h2>

          <p className="text-sm text-muted-foreground">
            Summarize the activities, key discussions, participant engagement,
            outcomes, challenges, and other important observations from this
            session.
          </p>
        </div>

        <TiptapEditor content={report} setContent={setReport} />
      </section>

      <Separator />

      <section className="space-y-6">
        <div>
          <h2 className="text-2xl font-semibold">Session Gallery</h2>

          <p className="text-sm text-muted-foreground">
            Upload images captured during the session. Each upload will be added
            to the gallery below.
          </p>
        </div>

        <ImageUpload
          altName={`${data.title}-session`}
          onUploadSuccess={(image) => {
            setImages((prev) => [...prev, image]);
            toast.success("Image uploaded.");
          }}
        />

        {images.length > 0 ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {images.map((image, index) => (
              <Card key={image.id} className="group overflow-hidden">
                <CardContent className="relative aspect-square p-0">
                  <Image
                    src={image.src}
                    alt={image.alt}
                    fill
                    className="object-cover transition duration-300 group-hover:scale-105"
                  />

                  <Button
                    size="icon"
                    type="button"
                    variant="destructive"
                    className="absolute right-3 top-3 opacity-0 transition group-hover:opacity-100"
                    onClick={() =>
                      setImages((prev) => prev.filter((_, i) => i !== index))
                    }
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="border-dashed">
            <CardContent className="flex h-56 flex-col items-center justify-center gap-3 text-center">
              <ImageIcon className="h-10 w-10 text-muted-foreground" />

              <div>
                <h3 className="font-medium">No images uploaded</h3>

                <p className="text-sm text-muted-foreground">
                  Upload session photographs to create a gallery.
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </section>

      <Separator />

      <div className="flex justify-end gap-3">
        <Button variant="outline" onClick={() => router.back()}>
          Cancel
        </Button>

        <Button onClick={handleSubmit} disabled={update.isPending}>
          {update.isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            "Save Session Report"
          )}
        </Button>
      </div>
    </main>
  );
}
