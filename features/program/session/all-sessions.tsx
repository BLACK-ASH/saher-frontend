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
import { useSessions } from "@/hooks/use-sessions";
import { SessionT } from "@/services/session.api";
import { useRouter, useSearchParams } from "next/navigation";
import RoleAccess from "@/components/role-access";

function SessionView() {
  const keyword = useSearchParams().get("keyword") || "";
  const { sessions, update, del } = useSessions({ keyword });
  const [open, setOpen] = useState(false);
  const [selectedSession, setSelectedSession] = useState<SessionT | null>(null);
  const [description, setDescription] = useState<string>("");
  const titleRef = useRef<HTMLTextAreaElement>(null);
  const router = useRouter();

  const { data, isLoading, refetch, isRefetching } = sessions;

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
      {data.map((session) => (
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
                  <RoleAccess roles={["admin", "manager"]}>
                    <DropdownMenuItem
                      onClick={() => {
                        setSelectedSession(session);
                        setDescription(session.description);
                        setOpen(true);
                      }}
                    >
                      Update
                    </DropdownMenuItem>
                  </RoleAccess>
                  <DropdownMenuItem
                    onClick={() =>
                      router.push("/program/sessions/attendance/" + session.id)
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
                  <RoleAccess roles={["admin"]}>
                    <DropdownMenuItem
                      className="text-destructive"
                      onClick={() => {
                        del.mutate(session.id, {
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

          <CardContent>{htmlToPreview(session.description, 100)}</CardContent>
        </Card>
      ))}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="min-w-3/4">
          <DialogHeader>
            <DialogTitle>Update {selectedSession?.title}</DialogTitle>
          </DialogHeader>

          <div className="space-y-2 min-h-2/3">
            <Field>
              <FieldLabel htmlFor="title">Title</FieldLabel>
              <Textarea
                id="title"
                defaultValue={selectedSession?.title}
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
                    id: selectedSession?.id as string,
                    data: {
                      id: selectedSession?.id as string,
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

export default SessionView;
