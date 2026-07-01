"use client";

import TiptapEditor from "@/components/tiptap/editor";
import { Button } from "@/components/ui/button";
import { Field, FieldLabel } from "@/components/ui/field";
import { Textarea } from "@/components/ui/textarea";
import { usePrograms } from "@/hooks/use-programs";
import { Dispatch, SetStateAction, useRef, useState } from "react";
import { toast } from "sonner";

const ProgramEditor = ({
  setVisble,
}: {
  setVisble: Dispatch<SetStateAction<boolean>>;
}) => {
  const [description, setDescription] = useState<string>(
    "Enter Program Description",
  );
  const titleRef = useRef<HTMLTextAreaElement>(null);

  const { add } = usePrograms();

  return (
    <div className="space-y-2 min-h-2/3">
      <Field>
        <FieldLabel htmlFor="title">Title</FieldLabel>
        <Textarea
          id="title"
          placeholder="Enter Program Title..."
          ref={titleRef}
        />
      </Field>
      <Field>
        <FieldLabel htmlFor="description">Description</FieldLabel>
        <TiptapEditor content={description} setContent={setDescription} />
      </Field>
      <Button
        onClick={() => {
          add.mutate(
            { title: titleRef.current?.value as string, description },
            {
              onSuccess: (res) => {
                toast.success(res.message);
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

export default ProgramEditor;
