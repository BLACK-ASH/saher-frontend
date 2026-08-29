"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus } from "lucide-react";
import { useState } from "react";
import ProgramEditor from "./program-editor";

const AddProgram = () => {
  const [visible, setVisible] = useState(false);

  return (
    <Dialog open={visible} onOpenChange={setVisible}>
      <DialogTrigger asChild>
        <Button className="flex items-center gap-2">
          <Plus />
          Create Program
        </Button>
      </DialogTrigger>
      <DialogContent className="min-w-3/4">
        <DialogHeader>
          <DialogTitle>Enter Details To Create A Program</DialogTitle>
        </DialogHeader>
        <ProgramEditor setVisble={setVisible} />
      </DialogContent>
    </Dialog>
  );
};

export default AddProgram;
