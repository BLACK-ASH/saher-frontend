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
import WorkshopEditor from "./workshop-editor";

const AddWorkshop = () => {
  const [visible, setVisible] = useState(false);

  return (
    <Dialog open={visible} onOpenChange={setVisible}>
      <DialogTrigger asChild>
        <Button className="flex items-center gap-2" variant={"outline"}>
          <Plus />
          Add Workshop
        </Button>
      </DialogTrigger>
      <DialogContent className="min-w-3/4">
        <DialogHeader>
          <DialogTitle>Enter Details To Create A Workshop</DialogTitle>
        </DialogHeader>
        <WorkshopEditor setVisble={setVisible} />
      </DialogContent>
    </Dialog>
  );
};

export default AddWorkshop;
