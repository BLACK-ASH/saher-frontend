"use client";

import TiptapEditor from "@/components/tiptap/editor";
import { Button } from "@/components/ui/button";
import { Field, FieldLabel } from "@/components/ui/field";
import { Textarea } from "@/components/ui/textarea";
import { useSessions } from "@/hooks/use-sessions";
import { Dispatch, SetStateAction, useRef, useState } from "react";
import { toast } from "sonner";

const SessionEditor = ({
  setVisble,
}: {
  setVisble: Dispatch<SetStateAction<boolean>>;
}) => {
  const [description, setDescription] = useState<string>(
    "Enter Session Description",
  );
  const titleRef = useRef<HTMLTextAreaElement>(null);

  const { add } = useSessions();

  return (
    <div className="space-y-2 min-h-2/3">
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

export default SessionEditor;
