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
import { useState } from "react";
import { toast } from "sonner";
import { htmlToPreview } from "@/lib/utils/html-preview";
import { useSessions } from "@/hooks/use-sessions";
import { SessionT } from "@/services/session.api";
import { useRouter, useSearchParams } from "next/navigation";
import RoleAccess from "@/components/role-access";
import { can } from "@/lib/permissions";
import SessionEditor from "./session-editor";

function SessionView() {
  const keyword = useSearchParams().get("keyword") || "";
  const [tab, setTab] = useState<"active" | "deleted">("active");
  const isDeleted = tab === "deleted" ? "true" : "false";
  const { sessions, del, restore } = useSessions({ keyword, isDeleted });
  const [editSession, setEditSession] = useState<SessionT | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<SessionT | null>(null);
  const router = useRouter();

  const { data, isLoading } = sessions;

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
                ? "No sessions in this workshop"
                : "No sessions yet"
              : "No deleted sessions"
          }
          description={
            tab === "active"
              ? "No sessions in this workshop — the first step is to create one."
              : "Deleted sessions will appear here."
          }
        />
      ) : (
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2">
          {data.items.map((session) => (
            <Card key={session.id}>
              <CardHeader>
                <CardTitle>{session.title}</CardTitle>
                <CardDescription>
                  {session.program.title} - {session.workshop.title.slice(0, 20)}
                </CardDescription>
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
                          router.push("/program/sessions/" + session.id)
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
                              onClick={() => setEditSession(session)}
                            >
                              Update
                            </DropdownMenuItem>
                          </RoleAccess>
                          <DropdownMenuItem
                            onClick={() =>
                              router.push(
                                "/program/sessions/attendance/" + session.id,
                              )
                            }
                          >
                            Attendance
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() =>
                              router.push("/program/sessions/review/" + session.id)
                            }
                          >
                            Add Review
                          </DropdownMenuItem>
                          <RoleAccess allow={(r) => can(r, "delete", "event")}>
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => setDeleteTarget(session)}
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
                              restore.mutate(session.id, {
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

              <CardContent>{htmlToPreview(session.description, 100)}</CardContent>
            </Card>
          ))}
        </section>
      )}

      <Dialog open={!!editSession} onOpenChange={(v) => !v && setEditSession(null)}>
        <DialogContent className="min-w-3/4">
          <DialogHeader>
            <DialogTitle>Edit {editSession?.title}</DialogTitle>
          </DialogHeader>
          {editSession && (
            <SessionEditor
              setVisble={(v) => !v && setEditSession(null)}
              session={editSession}
            />
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(v) => !v && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete session?</AlertDialogTitle>
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

export default SessionView;
