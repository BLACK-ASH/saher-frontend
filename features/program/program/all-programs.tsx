"use client";
import { DefaultLoader } from "@/components/loading";
import { NoData } from "@/components/no-data";
import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { usePrograms } from "@/hooks/use-programs";
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
import { ProgramsT } from "@/services/program.api";
import TiptapEditor from "@/components/tiptap/editor";
import { Field, FieldLabel } from "@/components/ui/field";
import { Textarea } from "@/components/ui/textarea";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { htmlToPreview } from "@/lib/utils/html-preview";
import { useRouter, useSearchParams } from "next/navigation";
import RoleAccess from "@/components/role-access";

function ProgramView() {
  const keyword = useSearchParams().get("keyword") || "";
  const { programs, update, del } = usePrograms({ keyword });
  const [open, setOpen] = useState(false);
  const [selectedProgram, setSelectedProgram] = useState<ProgramsT | null>(
    null,
  );
  const [description, setDescription] = useState<string>("");
  const titleRef = useRef<HTMLTextAreaElement>(null);
  const router = useRouter();

  const { data, isLoading } = programs;

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
      {data.map((program) => (
        <Card key={program.id}>
          <CardHeader>
            <CardTitle>{program.title}</CardTitle>

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
                    onClick={() => router.push("/program/" + program.id)}
                  >
                    View
                  </DropdownMenuItem>
                  <RoleAccess roles={["admin"]}>
                    <DropdownMenuItem
                      onClick={() => {
                        setSelectedProgram(program);
                        setDescription(program.description);
                        setOpen(true);
                      }}
                    >
                      Update
                    </DropdownMenuItem>
                  </RoleAccess>
                  <RoleAccess roles={["admin"]}>
                    <DropdownMenuItem
                      className="text-destructive"
                      onClick={() => {
                        del.mutate(program.id, {
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

          <CardContent>{htmlToPreview(program.description, 100)}</CardContent>
        </Card>
      ))}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="min-w-3/4">
          <DialogHeader>
            <DialogTitle>Update {selectedProgram?.title}</DialogTitle>
          </DialogHeader>

          <div className="space-y-2 min-h-2/3">
            <Field>
              <FieldLabel htmlFor="title">Title</FieldLabel>
              <Textarea
                id="title"
                defaultValue={selectedProgram?.title}
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
                    id: selectedProgram?.id as string,
                    data: {
                      id: selectedProgram?.id as string,
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

export default ProgramView;
