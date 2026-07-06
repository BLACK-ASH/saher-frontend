"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { useParticipants } from "@/hooks/use-participant";
import { usePrograms } from "@/hooks/use-programs";
import { ParticipantT } from "@/services/participant.api";
import { ArrowLeft, Plus, Trash2, User, Users, X } from "lucide-react";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";

export default function ProgramPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [keyword, setKeyword] = useState("");

  const { participants } = useParticipants({
    keyword,
    limit: 10,
  });

  const form = useForm<{
    participants: ParticipantT[];
  }>({
    defaultValues: {
      participants: [],
    },
  });

  const { program, addParticipants, removeParticipant } = usePrograms({ id });

  if (program.isLoading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <p className="text-muted-foreground">Loading program...</p>
      </div>
    );
  }

  if (!program.data) {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center gap-4">
        <h1 className="text-3xl font-bold">Program not found</h1>

        <Button onClick={() => router.back()}>Go Back</Button>
      </div>
    );
  }

  const data = program.data;

  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <Button variant="ghost" className="mb-8" onClick={() => router.back()}>
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back
      </Button>

      <header className="border-b pb-8">
        <Badge className="mb-4">Program</Badge>

        <h1 className="text-5xl font-bold tracking-tight">{data.title}</h1>

        <div className="mt-6 flex flex-wrap gap-8 text-sm text-muted-foreground">
          <div>
            <p className="font-medium text-foreground">Participants</p>

            <p>{data.participants?.length ?? 0}</p>
          </div>

          <div>
            <p className="font-medium text-foreground">Program ID</p>

            <p className="font-mono">{data.id}</p>
          </div>
        </div>
      </header>

      <article className="mt-12">
        <div
          className="
            prose
            prose-neutral
            dark:prose-invert
            max-w-none

            prose-headings:font-bold
            prose-headings:tracking-tight

            prose-p:text-base
            prose-p:leading-8

            prose-li:leading-8

            prose-img:rounded-xl
            prose-img:shadow-md

            prose-table:block
            prose-table:overflow-auto

            prose-pre:rounded-xl

            prose-code:before:hidden
            prose-code:after:hidden
          "
          dangerouslySetInnerHTML={{
            __html: data.description,
          }}
        />
      </article>
      {/* Participants */}
      <section className="mt-20 border-t pt-12">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold">Participants</h2>
            <p className="text-muted-foreground">
              Registered participants for this program.
            </p>
          </div>

          <Button variant={"outline"} onClick={() => setOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Participants
          </Button>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {data.participants?.map((participant) => (
            <Card
              key={participant.id}
              className="group relative cursor-pointer transition-all hover:border-primary hover:shadow-md"
              onClick={() =>
                router.push(`/program/participants/${participant.id}`)
              }
            >
              <Button
                size="icon"
                variant="ghost"
                className="absolute right-3 top-3 z-10"
                onClick={(e) => {
                  e.stopPropagation();

                  removeParticipant.mutate({
                    programId: data.id,
                    participantId: participant.id,
                  });
                }}
              >
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>

              <CardContent className="flex items-center gap-4 p-5">
                <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-full border bg-muted">
                  {participant.image ? (
                    <Image
                      src={participant.image.src}
                      alt={participant.image.alt}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      <User className="h-7 w-7 text-muted-foreground" />
                    </div>
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <CardTitle className="truncate text-lg transition-colors group-hover:text-primary">
                    {participant.name}
                  </CardTitle>

                  <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                    {participant.gender && (
                      <Badge variant="secondary">{participant.gender}</Badge>
                    )}

                    {participant.age && (
                      <Badge variant="outline">{participant.age} yrs</Badge>
                    )}
                  </div>

                  {participant.affiliation && (
                    <CardDescription className="mt-3 line-clamp-2">
                      {participant.affiliation}
                    </CardDescription>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
      <Dialog
        open={open}
        onOpenChange={(v) => {
          setOpen(v);
          if (!v) {
            form.reset();
            setKeyword("");
          }
        }}
      >
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Add Participants</DialogTitle>
          </DialogHeader>

          <Controller
            name="participants"
            control={form.control}
            render={({ field }) => (
              <Field>
                <FieldLabel>Select Participants</FieldLabel>

                {field.value.length > 0 && (
                  <div className="mb-3 flex flex-wrap gap-2">
                    {field.value.map((participant) => (
                      <div
                        key={participant.id}
                        className="flex items-center gap-2 rounded-full bg-muted px-3 py-1 text-sm"
                      >
                        {participant.name}

                        <button
                          type="button"
                          onClick={() =>
                            field.onChange(
                              field.value.filter(
                                (p) => p.id !== participant.id,
                              ),
                            )
                          }
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <Input
                  placeholder="Search participant..."
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                />

                <div className="mt-2 max-h-64 overflow-y-auto rounded-md border">
                  {participants.isLoading ? (
                    <div className="p-4 text-center text-sm text-muted-foreground">
                      Loading...
                    </div>
                  ) : (
                    participants.data
                      ?.filter(
                        (participant) =>
                          !data.participants?.some(
                            (p) => p.id === participant.id,
                          ),
                      )
                      .map((participant) => (
                        <button
                          key={participant.id}
                          type="button"
                          className="flex w-full items-center gap-3 px-3 py-2 text-left transition-colors hover:bg-muted"
                          onClick={() => {
                            if (
                              !field.value.some((p) => p.id === participant.id)
                            ) {
                              field.onChange([...field.value, participant]);
                            }
                          }}
                        >
                          <div className="relative h-10 w-10 overflow-hidden rounded-full border">
                            {participant.image ? (
                              <Image
                                src={participant.image.src}
                                alt={participant.image.alt}
                                fill
                                className="object-cover"
                              />
                            ) : (
                              <div className="flex h-full items-center justify-center">
                                <User className="h-4 w-4" />
                              </div>
                            )}
                          </div>

                          <div>
                            <p className="font-medium">{participant.name}</p>

                            <p className="text-xs text-muted-foreground">
                              {participant.affiliation}
                            </p>
                          </div>
                        </button>
                      ))
                  )}
                </div>
              </Field>
            )}
          />

          <DialogFooter>
            <Button variant="destructive" onClick={() => setOpen(false)}>
              Cancel
            </Button>

            <Button
              variant={"outline"}
              onClick={() => {
                addParticipants.mutate(
                  {
                    id: data.id,
                    participants: form
                      .getValues("participants")
                      .map((p) => p.id),
                  },
                  {
                    onSuccess: (res) => {
                      toast.success(res.message);
                      setOpen(false);
                      form.reset();
                      setKeyword("");
                    },
                  },
                );
              }}
            >
              Add Participants
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
}
