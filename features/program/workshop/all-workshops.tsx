"use client";
import { DefaultLoader } from "@/components/loading";
import { NoData } from "@/components/no-data";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { MoreHorizontal } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import TiptapEditor from "@/components/tiptap/editor";
import { Field, FieldLabel } from "@/components/ui/field";
import { Textarea } from "@/components/ui/textarea";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { htmlToPreview } from "@/lib/utils/html-preview";
import { useWorkshops } from "@/hooks/use-workshops";
import { WorkshopT } from "@/services/workshop.api";
import { useRouter, useSearchParams } from "next/navigation";
import RoleAccess from "@/components/role-access";

function WorkshopView() {
  const keyword = useSearchParams().get("keyword") || "";
  const { workshops, update, del } = useWorkshops({ keyword });
  const [open, setOpen] = useState(false);
  const [selectedWorkshop, setSelectedWorkshop] = useState<WorkshopT | null>(
    null,
  );
  const [description, setDescription] = useState<string>("");
  const titleRef = useRef<HTMLTextAreaElement>(null);
  const router = useRouter();

  const { data, isLoading } = workshops;

  if (isLoading) return <DefaultLoader className="col-span-2" />;
  if (!data)
    return (
      <NoData
        className="col-span-2"
        title="No Program To Show."
        description="Please Refresh or No Program To Show."
      />
    );

  return (
    <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2">
      {data.map((workshop) => (
        <Card key={workshop.id}>
          <CardHeader>
            <CardTitle>{workshop.title}</CardTitle>
            <CardDescription>{workshop.program.title}</CardDescription>
            <CardAction>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>

                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Actions</DropdownMenuLabel>

                  <DropdownMenuItem
                    onClick={() =>
                      router.push("/program/workshops/" + workshop.id)
                    }
                  >
                    View
                  </DropdownMenuItem>
                  <RoleAccess allow={(r) => r === "admin" || r === "manager"}>
                    <DropdownMenuItem
                      onClick={() => {
                        setSelectedWorkshop(workshop);
                        setDescription(workshop.description);
                        setOpen(true);
                      }}
                    >
                      Update
                    </DropdownMenuItem>
                  </RoleAccess>
                  <RoleAccess allow={(r) => r === "admin"}>
                    <DropdownMenuItem
                      className="text-destructive"
                      onClick={() => {
                        del.mutate(workshop.id, {
                          onSuccess: (res) => {
                            toast.success(res.message);
                          },
                        });
                      }}
                    >
                      Delete
                    </DropdownMenuItem>
                  </RoleAccess>
                </DropdownMenuContent>
              </DropdownMenu>
            </CardAction>
          </CardHeader>

          <CardContent>{htmlToPreview(workshop.description, 100)}</CardContent>
        </Card>
      ))}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="min-w-3/4">
          <DialogHeader>
            <DialogTitle>Update {selectedWorkshop?.title}</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 min-h-2/3">
            <Field>
              <FieldLabel htmlFor="title">Title</FieldLabel>
              <Textarea
                id="title"
                defaultValue={selectedWorkshop?.title}
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
                update.mutate(
                  {
                    id: selectedWorkshop?.id as string,
                    data: {
                      id: selectedWorkshop?.id as string,
                      title: titleRef.current?.value as string,
                      description,
                    },
                  },
                  {
                    onSuccess: (res) => {
                      toast.success(res.message);
                    },
                  },
                );
                setOpen(false);
              }}
            >
              Submit
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </section>
  );
}

export default WorkshopView;
