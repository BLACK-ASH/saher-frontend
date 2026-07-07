"use client";

import Image from "next/image";
import { notFound, useParams, useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import {
  User,
  Phone,
  MapPin,
  GraduationCap,
  Users,
  FileText,
  ArrowLeft,
  Download,
} from "lucide-react";
import { useParticipants } from "@/hooks/use-participant";
import { DefaultLoader } from "@/components/loading";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";

export default function ParticipantPage() {
  const [selectedImage, setSelectedImage] = useState<{
    src: string;
    alt: string;
  } | null>(null);
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { participant } = useParticipants({ id });
  const { data, isLoading } = participant;

  if (isLoading) return <DefaultLoader className="col-span-2" />;
  if (!data) notFound();

  if (!data) {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center gap-4">
        <h1 className="text-3xl font-bold">Participant not found</h1>

        <Button onClick={() => router.back()}>Go Back</Button>
      </div>
    );
  }

  return (
    <main className="mx-auto max-w-7xl space-y-12">
      <Button
        className="flex gap-2 items-center my-4"
        onClick={() => router.back()}
        variant={"ghost"}
      >
        <ArrowLeft /> Back
      </Button>
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Participant Profile
        </h1>
        <p className="mt-1 text-muted-foreground">
          View participant information and uploaded documents.
        </p>
      </div>

      {/* Profile */}
      <div className="flex flex-col items-center border-b pb-10 text-center">
        <div className="relative h-44 w-44 overflow-hidden rounded-full border-4 border-background shadow-xl">
          {data.image ? (
            <Image
              src={data.image.src}
              alt={data.image.alt}
              fill
              onClick={() =>
                setSelectedImage({
                  src: data.image?.src as string,
                  alt: data.image?.alt as string,
                })
              }
              className="object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-muted">
              <User className="h-20 w-20 text-muted-foreground" />
            </div>
          )}
        </div>

        <h2 className="mt-6 text-4xl font-bold">{data.name}</h2>

        <div className="mt-3 flex flex-wrap justify-center gap-2">
          {data.gender && <Badge>{data.gender}</Badge>}

          {data.age && <Badge variant="secondary">{data.age} Years</Badge>}
        </div>
      </div>

      {/* Personal Information */}
      <section className="space-y-6">
        <div>
          <h2 className="text-2xl font-semibold">Personal Information</h2>
          <p className="text-sm text-muted-foreground">
            Basic details of the participant.
          </p>
        </div>

        <div className="overflow-hidden rounded-xl border">
          {data.phoneNumber && (
            <div className="grid grid-cols-1 gap-3 border-b p-6 md:grid-cols-[220px_1fr]">
              <div className="flex items-center gap-2 font-medium text-muted-foreground">
                <Phone className="h-4 w-4" />
                Phone Number
              </div>
              <p>{data.phoneNumber}</p>
            </div>
          )}

          {data.address && (
            <div className="grid grid-cols-1 gap-3 border-b p-6 md:grid-cols-[220px_1fr]">
              <div className="flex items-center gap-2 font-medium text-muted-foreground">
                <MapPin className="h-4 w-4" />
                Address
              </div>
              <p>{data.address}</p>
            </div>
          )}

          {data.affiliation && (
            <div className="grid grid-cols-1 gap-3 border-b p-6 md:grid-cols-[220px_1fr]">
              <div className="flex items-center gap-2 font-medium text-muted-foreground">
                <GraduationCap className="h-4 w-4" />
                Affiliation
              </div>
              <p>{data.affiliation}</p>
            </div>
          )}

          {data.parentDetails && (
            <div className="grid grid-cols-1 gap-3 p-6 md:grid-cols-[220px_1fr]">
              <div className="flex items-center gap-2 font-medium text-muted-foreground">
                <Users className="h-4 w-4" />
                Parent / Guardian
              </div>
              <p className="whitespace-pre-wrap">{data.parentDetails}</p>
            </div>
          )}
        </div>
      </section>

      {/* Documents */}
      <section className="space-y-6">
        <div>
          <h2 className="text-2xl font-semibold">Documents</h2>
          <p className="text-sm text-muted-foreground">
            Uploaded participant documents.
          </p>
        </div>

        {data.document?.length ? (
          <div className="grid grid-cols-2 gap-5 md:grid-cols-3 lg:grid-cols-4">
            {data.document.map((doc) => (
              <button
                key={doc.id}
                type="button"
                onClick={() =>
                  setSelectedImage({
                    src: doc.src,
                    alt: doc.alt,
                  })
                }
                className="group relative aspect-4/5 overflow-hidden rounded-xl border bg-muted"
              >
                <Image
                  src={doc.src}
                  alt={doc.alt}
                  fill
                  className="object-cover transition duration-300 group-hover:scale-105"
                />

                <div className="absolute inset-x-0 bottom-0 bg-linear-to-t from-black/70 to-transparent p-3">
                  <p className="truncate text-sm text-white">{doc.alt}</p>
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div className="flex h-56 items-center justify-center rounded-xl border border-dashed">
            <div className="text-center">
              <FileText className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
              <p className="font-medium">No documents uploaded</p>
              <p className="text-sm text-muted-foreground">
                This participant has not uploaded any documents.
              </p>
            </div>
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
