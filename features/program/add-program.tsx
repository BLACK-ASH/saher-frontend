"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import ProgramEditor from "@/features/program/program-editor";
import { Plus } from "lucide-react";

const AddProgram = () => {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button className="flex items-center gap-2" variant={"outline"}>
          <Plus />
          Add Program
        </Button>
      </DialogTrigger>
      <DialogContent className="min-w-3/4 min-h-2/3">
        <DialogHeader>
          <DialogTitle>Enter Details To Create A Program</DialogTitle>
          <DialogDescription>
            This action cannot be undone. This will permanently delete your
            account and remove your data from our servers.
          </DialogDescription>
        </DialogHeader>
        <ProgramEditor />
      </DialogContent>
    </Dialog>
  );
};

export default AddProgram;
