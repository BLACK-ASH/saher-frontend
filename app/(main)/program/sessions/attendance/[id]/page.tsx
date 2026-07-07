"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { usePrograms } from "@/hooks/use-programs";
import { useSessions } from "@/hooks/use-sessions";
import { ArrowLeft, User } from "lucide-react";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";

export default function SessionAttendancePage() {
  const { id } = useParams<{ id: string }>(); // session id
  const router = useRouter();

  const { session, markAttendance } = useSessions({ id });

  const { program } = usePrograms({
    id: session.data?.program.id,
  });

  const form = useForm<{
    present: string[];
  }>({
    defaultValues: {
      present: [],
    },
  });

  if (session.isLoading || program.isLoading) {
    return (
      <div className="flex h-[70vh] items-center justify-center">
        Loading...
      </div>
    );
  }

  if (!session.data || !program.data) {
    return (
      <div className="flex h-[70vh] items-center justify-center">
        Unable to load attendance.
      </div>
    );
  }

  const participants = program.data.participants ?? [];

  const onSubmit = (values: { present: string[] }) => {
    markAttendance.mutate(
      {
        id: session.data.id,
        data: { participantIds: values.present },
      },
      {
        onSuccess: (res) => {
          toast.success(res.message);
          router.push(`/program/sessions/${session.data.id}`);
        },
      },
    );
  };

  return (
    <main className="mx-auto max-w-7xl space-y-12 p-4">
      <Button
        variant="ghost"
        className="gap-2 my-6"
        onClick={() => router.back()}
      >
        <ArrowLeft className="h-4 w-4" />
        Back
      </Button>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Session Attendance</h1>
          <p className="text-muted-foreground">{session.data.title}</p>
        </div>

        <Badge variant="secondary">
          {form.watch("present").length} / {participants.length} Present
        </Badge>
      </div>
      <Controller
        name="present"
        control={form.control}
        render={({ field }) => (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {participants.map((participant) => {
              const checked = field.value.includes(participant.id);

              return (
                <Card
                  key={participant.id}
                  className={`cursor-pointer transition ${
                    checked
                      ? "border-green-500 bg-green-500/5"
                      : "hover:border-primary"
                  }`}
                  onClick={() => {
                    if (checked) {
                      field.onChange(
                        field.value.filter((id) => id !== participant.id),
                      );
                    } else {
                      field.onChange([...field.value, participant.id]);
                    }
                  }}
                >
                  <CardContent className="flex items-center gap-4 p-5">
                    <Checkbox checked={checked} />

                    <div className="relative h-14 w-14 overflow-hidden rounded-full border">
                      {participant.image ? (
                        <Image
                          src={participant.image.src}
                          alt={participant.image.alt}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center">
                          <User className="h-6 w-6 text-muted-foreground" />
                        </div>
                      )}
                    </div>

                    <div className="flex-1">
                      <h3 className="font-semibold">{participant.name}</h3>

                      <p className="text-sm text-muted-foreground">
                        {participant.affiliation}
                      </p>
                    </div>

                    {checked && <Badge className="bg-green-600">Present</Badge>}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      />

      <div className="flex justify-end gap-3">
        <Button variant="outline" onClick={() => router.back()}>
          Cancel
        </Button>

        <Button
          variant="secondary"
          onClick={() =>
            form.setValue(
              "present",
              participants.map((p) => p.id),
            )
          }
        >
          Mark All
        </Button>

        <Button variant="outline" onClick={() => form.setValue("present", [])}>
          Clear
        </Button>

        <Button onClick={form.handleSubmit(onSubmit)}>Submit Attendance</Button>
      </div>
    </main>
  );
}
