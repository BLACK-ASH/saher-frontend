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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, RotateCcw, Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { can } from "@/lib/permissions";

function WorkshopView() {
  const keyword = useSearchParams().get("keyword") || "";
  const [tab, setTab] = useState<"active" | "deleted">("active");
  const isDeleted = tab === "deleted" ? "true" : "false";
  const { workshops, update, del, restore } = useWorkshops({
    keyword,
    isDeleted,
  });
  const [open, setOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<WorkshopT | null>(null);
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
    <div className="space-y-4">
      <Tabs value={tab} onValueChange={(v) => setTab(v as "active" | "deleted")}>
        <TabsList>
          <TabsTrigger value="active">Active</TabsTrigger>
          <TabsTrigger value="deleted">Deleted</TabsTrigger>
        </TabsList>
      </Tabs>

      {data.items.length === 0 ? (
        <NoData
          title={
            tab === "active"
              ? keyword
                ? "No workshops in this program"
                : "No workshops yet"
              : "No deleted workshops"
          }
          description={
            tab === "active"
              ? "No workshops in this program — the first step is to create one."
              : "Deleted workshops will appear here."
          }
        />
      ) : (
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2">
          {data.items.map((workshop) => (
            <Card key={workshop.id}>
              <CardHeader>
                <CardTitle>{workshop.title}</CardTitle>
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

                      {tab === "active" && (
                        <>
                          <RoleAccess
                            allow={(r) => can(r, "update", "event")}
                          >
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
                          <RoleAccess allow={(r) => can(r, "delete", "event")}>
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => setDeleteTarget(workshop)}
                            >
                              Delete
                            </DropdownMenuItem>
                          </RoleAccess>
                        </>
                      )}

                      {tab === "deleted" && (
                        <RoleAccess allow={(r) => can(r, "update", "event")}>
                          <DropdownMenuItem
                            onClick={() => {
                              restore.mutate(workshop.id, {
                                onSuccess: (res) => {
                                  toast.success(
                                    (res as { message: string }).message,
                                  );
                                },
                              });
                            }}
                          >
                            <RotateCcw className="mr-2 h-4 w-4" />
                            Restore
                          </DropdownMenuItem>
                        </RoleAccess>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </CardAction>
              </CardHeader>

              <CardContent>
                <p className="text-sm text-muted-foreground">
                  {workshop.program.title}
                </p>
                {htmlToPreview(workshop.description, 100)}
              </CardContent>
            </Card>
          ))}
        </section>
      )}

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
                      toast.success((res as { message: string }).message);
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

      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(v) => !v && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete workshop?</AlertDialogTitle>
            <AlertDialogDescription>
              This moves {deleteTarget?.title} to the trash. You can restore it
              later from the Deleted tab.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              className="flex items-center gap-2"
              onClick={() => {
                if (deleteTarget) {
                  del.mutate(deleteTarget.id, {
                    onSuccess: (res) => {
                      toast.success((res as { message: string }).message);
                    },
                  });
                }
                setDeleteTarget(null);
              }}
            >
              <Trash2 className="h-4 w-4" />
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default WorkshopView;
