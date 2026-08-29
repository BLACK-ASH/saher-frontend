"use client";

import TiptapEditor from "@/components/tiptap/editor";
import { Button } from "@/components/ui/button";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { usePrograms } from "@/hooks/use-programs";
import { useWorkshops } from "@/hooks/use-workshops";
import { ProgramsT } from "@/services/program.api";
import { X } from "lucide-react";
import { Dispatch, SetStateAction, useRef, useState } from "react";
import { toast } from "sonner";

const WorkshopEditor = ({
  setVisble,
}: {
  setVisble: Dispatch<SetStateAction<boolean>>;
}) => {
  const [description, setDescription] = useState<string>(
    "Enter Workshop Description",
  );
  const [program, setProgram] = useState<ProgramsT>();
  const [keyword, setKeyword] = useState<string>("");
  const titleRef = useRef<HTMLTextAreaElement>(null);

  const { add } = useWorkshops({});
  const { programs } = usePrograms({ keyword, limit: 3 });

  return (
    <div className="space-y-2 min-h-2/3">
      <Field>
        <FieldLabel htmlFor="program">Program</FieldLabel>

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
                      setProgram(item);
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
      </Field>
      <Field>
        <FieldLabel htmlFor="title">Title</FieldLabel>
        <Textarea
          id="title"
          placeholder="Enter Workshop Title..."
          ref={titleRef}
        />
      </Field>
      <Field>
        <FieldLabel htmlFor="description">Description</FieldLabel>
        <TiptapEditor content={description} setContent={setDescription} />
      </Field>
      <Button
        disabled={!program}
        onClick={() => {
          add.mutate(
            {
              programId: program?.id as string,
              data: { title: titleRef.current?.value as string, description },
            },
            {
              onSuccess: (res) => {
                toast.success((res as { message: string }).message);
              },
            },
          );
          setVisble(false);
        }}
      >
        Submit
      </Button>
    </div>
  );
};

export default WorkshopEditor;
