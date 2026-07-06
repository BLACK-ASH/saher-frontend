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
import SessionEditor from "./session-editor";

const AddSession = () => {
  const [visible, setVisible] = useState(false);

  return (
    <Dialog open={visible} onOpenChange={setVisible}>
      <DialogTrigger asChild>
        <Button className="flex items-center gap-2" variant={"outline"}>
          <Plus />
          Add Sessions
        </Button>
      </DialogTrigger>
      <DialogContent className="min-w-3/4">
        <DialogHeader>
          <DialogTitle>Enter Details To Create A Workshop</DialogTitle>
        </DialogHeader>
        <SessionEditor setVisble={setVisible} />
      </DialogContent>
    </Dialog>
  );
};

export default AddSession;
