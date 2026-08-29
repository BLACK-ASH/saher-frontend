"use client";

import { MailUser } from "@/services/mail.api";
import TiptapEditor from "@/components/tiptap/editor";
import { Button } from "@/components/ui/button";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useMail } from "@/hooks/use-mail";
import { usePrograms } from "@/hooks/use-programs";
import { useSessions } from "@/hooks/use-sessions";
import { useWorkshops } from "@/hooks/use-workshops";
import { ProgramsT } from "@/services/program.api";
import { SessionCreateT, SessionT } from "@/services/session.api";
import { WorkshopT } from "@/services/workshop.api";
import { zodResolver } from "@hookform/resolvers/zod";
import { X } from "lucide-react";
import { Dispatch, SetStateAction, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import z from "zod";
import { combineDateAndTimeToIso, isoToIstInput } from "@/lib/date";

type ProgramSel = Pick<ProgramsT, "id" | "title">;
type WorkshopSel = Pick<WorkshopT, "id" | "title">;

const sessionCreateSchema = z.object({
  program: z.string().min(1, "Program is required."),
  workshop: z.string().min(1, "Workshop is required."),
  title: z.string().min(3, "Title must be at least 3 characters."),
  description: z.string().min(5, "Description is required."),
  date: z.string().min(1, "Date is required."),
  startTime: z.string().min(1, "Start time is required."),
  endTime: z.string().min(1, "End time is required."),
  speaker: z.array(z.any()).min(1, "Atleast one speaker is required."),
});

const SessionEditor = ({
  setVisble,
  session,
}: {
  setVisble: Dispatch<SetStateAction<boolean>>;
  session?: SessionT;
}) => {
  const isEdit = !!session;

  // Prefill from an existing session (edit mode) using IST input helpers.
  const prefilled = session
    ? {
        program: { id: session.program.id, title: session.program.title },
        workshop: { id: session.workshop.id, title: session.workshop.title },
        date: isoToIstInput(session.date).split("T")[0],
        startTime: isoToIstInput(session.startTime).split("T")[1] ?? "",
        endTime: isoToIstInput(session.endTime).split("T")[1] ?? "",
      }
    : null;

  const [program, setProgram] = useState<ProgramSel | undefined>(
    prefilled?.program,
  );
  const [keyword, setKeyword] = useState<string>("");

  const [workshop, setWorkshop] = useState<WorkshopSel | undefined>(
    prefilled?.workshop,
  );
  const [wKeyword, setWKeyword] = useState<string>(prefilled?.program.id ?? "");

  const [userKeyWord, setUserKeyword] = useState("");
  const { user: users } = useMail({ keyword: userKeyWord });

  const { add, update } = useSessions({});
  const { programs } = usePrograms({ keyword, limit: 3 });
  const { workshops } = useWorkshops({ keyword: wKeyword, limit: 5 });

  const form = useForm<z.infer<typeof sessionCreateSchema>>({
    resolver: zodResolver(sessionCreateSchema),
    defaultValues: {
      program: prefilled?.program.id ?? "",
      workshop: prefilled?.workshop.id ?? "",
      title: session?.title ?? "",
      description: session?.description ?? "<p>Enter Session Description</p>",
      date: prefilled?.date ?? "",
      startTime: prefilled?.startTime ?? "",
      endTime: prefilled?.endTime ?? "",
      speaker: (session?.speaker ?? []) as MailUser[],
    },
  });

  const onSubmit = (values: z.infer<typeof sessionCreateSchema>) => {
    const payload: SessionCreateT = {
      title: values.title,
      description: values.description,
      program: values.program,
      workshop: values.workshop,
      speaker: values.speaker.map((e: MailUser) => e.id.toString()),
      date: values.date,
      startTime: new Date(combineDateAndTimeToIso(values.date, values.startTime)),
      endTime: new Date(combineDateAndTimeToIso(values.date, values.endTime)),
    };

    const onError = (err: Error) => {
      // Surface the future-date 400 inline instead of a silent toast.
      if (err.message.includes("Date must be present or future")) {
        form.setError("date", {
          type: "server",
          message: err.message,
        });
      }
    };

    if (isEdit && session) {
      update.mutate(
        {
          id: session.id,
          data: {
            title: payload.title,
            description: payload.description,
            date: payload.date,
            startTime: combineDateAndTimeToIso(values.date, values.startTime),
            endTime: combineDateAndTimeToIso(values.date, values.endTime),
            speaker: payload.speaker,
            workshop: payload.workshop,
          },
        },
        {
          onSuccess: (res) => {
            toast.success((res as { message: string }).message);
            setVisble(false);
          },
          onError,
        },
      );
    } else {
      add.mutate(
        {
          programId: values.program,
          data: payload,
        },
        {
          onSuccess: (res) => {
            toast.success((res as { message: string }).message);
            setVisble(false);
          },
          onError,
        },
      );
    }
  };

  return (
    <div className="space-y-2 min-h-2/3">
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          <Controller
            name="program"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field>
                <FieldLabel>Program</FieldLabel>

                {program ? (
                  <div className="flex items-center justify-between rounded-md border bg-muted/50 px-3 py-2">
                    <span className="truncate text-sm font-medium">
                      {program.title}
                    </span>

                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => {
                        setProgram(undefined);
                        setKeyword("");
                        field.onChange("");
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <>
                    <Input
                      id="program"
                      placeholder="Search program..."
                      value={keyword}
                      onChange={(e) => setKeyword(e.target.value)}
                      autoComplete="off"
                    />

                    <div className="mt-2 max-h-56 overflow-y-auto rounded-md border">
                      {programs.isLoading ? (
                        <div className="px-3 py-4 text-center text-sm text-muted-foreground">
                          Loading programs...
                        </div>
                      ) : programs.data?.items.length ? (
                        programs.data.items.map((item) => (
                          <button
                            key={item.id}
                            type="button"
                            className="flex w-full items-center px-3 py-2 text-left text-sm transition-colors hover:bg-muted"
                            onClick={() => {
                              setProgram({ id: item.id, title: item.title });
                              field.onChange(item.id);
                              setWKeyword(item.id);
                              setKeyword("");
                            }}
                          >
                            {item.title}
                          </button>
                        ))
                      ) : (
                        <div className="px-3 py-4 text-center text-sm text-muted-foreground">
                          No programs found.
                        </div>
                      )}
                    </div>
                  </>
                )}
                {fieldState.error && (
                  <p className="text-sm text-destructive">
                    {fieldState.error.message}
                  </p>
                )}
              </Field>
            )}
          />
          <Controller
            name="workshop"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field>
                <FieldLabel>Workshop</FieldLabel>

                {workshop ? (
                  <div className="flex items-center justify-between rounded-md border bg-muted/50 px-3 py-2">
                    <span className="truncate text-sm font-medium">
                      {workshop.title}
                    </span>

                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => {
                        setWorkshop(undefined);
                        setWKeyword(program?.id ?? "");
                        field.onChange("");
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <>
                    <Input
                      id="workshop"
                      placeholder="Search workshops..."
                      value={wKeyword}
                      onChange={(e) => setWKeyword(e.target.value)}
                      autoComplete="off"
                    />

                    <div className="mt-2 max-h-56 overflow-y-auto rounded-md border">
                      {workshops.isLoading ? (
                        <div className="px-3 py-4 text-center text-sm text-muted-foreground">
                          Loading workshops...
                        </div>
                      ) : workshops.data?.items.length ? (
                        workshops.data.items.map((item) => (
                          <button
                            key={item.id}
                            type="button"
                            className="flex w-full items-center px-3 py-2 text-left text-sm transition-colors hover:bg-muted"
                            onClick={() => {
                              setWorkshop({ id: item.id, title: item.title });
                              field.onChange(item.id);
                              setWKeyword("");
                            }}
                          >
                            {item.title} - {item.program.title}
                          </button>
                        ))
                      ) : (
                        <div className="px-3 py-4 text-center text-sm text-muted-foreground">
                          No workshops found in this program.
                        </div>
                      )}
                    </div>
                  </>
                )}
                {fieldState.error && (
                  <p className="text-sm text-destructive">
                    {fieldState.error.message}
                  </p>
                )}
              </Field>
            )}
          />
        </div>

        <Controller
          name="speaker"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field>
              <FieldLabel htmlFor="speaker">Speaker</FieldLabel>

              {/* chips */}
              <div className="flex flex-wrap gap-2 mb-2">
                {field.value.map((user: MailUser) => (
                  <div
                    key={user.id}
                    className="flex items-center gap-2 rounded-full bg-muted px-2 py-1 text-sm"
                  >
                    {user.name}
                    <button
                      type="button"
                      onClick={() =>
                        field.onChange(
                          field.value.filter((u: MailUser) => u.id !== user.id),
                        )
                      }
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>

              <Input
                id="speaker"
                placeholder="Search Speaker..."
                value={userKeyWord}
                onChange={(e) => setUserKeyword(e.target.value)}
              />

              <div className="border mt-2 rounded-md max-h-40 overflow-auto">
                {users.data?.map((user: MailUser) => (
                  <div
                    key={user.id}
                    className="px-3 py-2 hover:bg-muted cursor-pointer"
                    onClick={() => {
                      if (
                        !field.value.some((u: MailUser) => u.id === user.id)
                      ) {
                        field.onChange([...field.value, user]);
                        setUserKeyword("");
                      }
                    }}
                  >
                    {user.name} - {user.email}
                  </div>
                ))}
              </div>
              {fieldState.error && (
                <p className="text-sm text-destructive">
                  {fieldState.error.message}
                </p>
              )}
            </Field>
          )}
        />
        <Controller
          name="title"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field>
              <FieldLabel htmlFor="title">Title</FieldLabel>
              <Textarea
                {...field}
                id="title"
                placeholder="Enter session title..."
              />
              {fieldState.error && (
                <p className="text-sm text-destructive">
                  {fieldState.error.message}
                </p>
              )}
            </Field>
          )}
        />

        <div className="grid gap-4 md:grid-cols-3">
          <Controller
            name="date"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field>
                <FieldLabel htmlFor="date">Date</FieldLabel>
                <Input {...field} id="date" type="date" />
                <p className="text-xs text-muted-foreground">
                  Sessions are future-dated only.
                </p>
                {fieldState.error && (
                  <p className="text-sm text-destructive">
                    {fieldState.error.message}
                  </p>
                )}
              </Field>
            )}
          />

          <Controller
            name="startTime"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field>
                <FieldLabel htmlFor="startTime">Start Time</FieldLabel>
                <Input {...field} id="startTime" type="time" />
                {fieldState.error && (
                  <p className="text-sm text-destructive">
                    {fieldState.error.message}
                  </p>
                )}
              </Field>
            )}
          />

          <Controller
            name="endTime"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field>
                <FieldLabel htmlFor="endTime">End Time</FieldLabel>
                <Input
                  {...field}
                  id="endTime"
                  type="time"
                  min={form.watch("startTime")}
                />
                {fieldState.error && (
                  <p className="text-sm text-destructive">
                    {fieldState.error.message}
                  </p>
                )}
              </Field>
            )}
          />
        </div>

        <Controller
          name="description"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field>
              <FieldLabel>Description</FieldLabel>
              <TiptapEditor content={field.value} setContent={field.onChange} />
              {fieldState.error && (
                <p className="text-sm text-destructive">
                  {fieldState.error.message}
                </p>
              )}
            </Field>
          )}
        />

        <Button
          type="submit"
          disabled={add.isPending || update.isPending}
        >
          {add.isPending || update.isPending
            ? "Saving..."
            : isEdit
              ? "Save Session"
              : "Create Session"}
        </Button>
      </form>
    </div>
  );
};

export default SessionEditor;
