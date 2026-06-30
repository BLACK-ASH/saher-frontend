"use client";

import TiptapEditor from "@/components/tiptap/editor";
import { Button } from "@/components/ui/button";
import { Field, FieldLabel } from "@/components/ui/field";
import { Textarea } from "@/components/ui/textarea";
import { useRef, useState } from "react";

const ProgramEditor = () => {
  const [description, setDescription] = useState<string>(
    "Enter Program Description",
  );
  const titleRef = useRef<HTMLTextAreaElement>(null);

  return (
    <div className="space-y-2 min-h-2/3">
      <Field>
        <FieldLabel htmlFor="title">Display Name</FieldLabel>
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
          console.log({ title: titleRef.current?.value, description });
        }}
      >
        Submit
      </Button>
    </div>
  );
};

export default ProgramEditor;
