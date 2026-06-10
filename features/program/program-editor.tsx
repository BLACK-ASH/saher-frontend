"use client";

import TiptapEditor from "@/components/tiptap/editor";
import { Button } from "@/components/ui/button";
import { useState } from "react";

const ProgramEditor = () => {
  const [description, setDescription] = useState<string>(
    "Enter Program Description",
  );
  return (
    <div>
      <TiptapEditor content={description} setContent={setDescription} />
      <Button
        onClick={() => {
          console.log(description);
        }}
      >
        Submit
      </Button>
    </div>
  );
};

export default ProgramEditor;
