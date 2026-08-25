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
import { BadgeInfo, MapPin, MoreHorizontal, Phone, Users } from "lucide-react";
import { toast } from "sonner";
import { useRouter, useSearchParams } from "next/navigation";
import { useParticipants } from "@/hooks/use-participant";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useState } from "react";
import { ParticipantT } from "@/services/participant.api";
import UpdateParticipant from "./update-participant";
import RoleAccess from "@/components/role-access";

function ParticipantView() {
  const keyword = useSearchParams().get("keyword") || "";
  const page = Number(useSearchParams().get("page")) || 1;
  const { participants, del } = useParticipants({
    keyword,
    limit: 16,
    page,
  });
  const { data, isLoading } = participants;
  const [participant, setParticipant] = useState<ParticipantT | null>(null);
  const [visible, setVisible] = useState(false);
  const router = useRouter();

  if (isLoading) return <DefaultLoader className="col-span-2" />;
  if (!data || data.length === 0)
    return (
      <NoData
        className="col-span-2"
        title="No Participant To Show."
        description="Please Refresh or No Participants To Show."
      />
    );

  return (
    <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2">
      {data.map((participant) => (
        <Card key={participant.id} className="w-full">
          <CardHeader className="flex flex-row justify-between items-center gap-4">
            <div className="flex gap-2 items-center">
              <Avatar className="h-16 w-16">
                <AvatarImage
                  src={participant.image?.src}
                  alt={participant.name}
                />
                <AvatarFallback>
                  {participant?.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .slice(0, 2)
                    .toUpperCase()}
                </AvatarFallback>
              </Avatar>

              <div className="space-y-1">
                <CardTitle>{participant.name}</CardTitle>
                <CardDescription>
                  {[
                    participant.gender,
                    participant.age ? `${participant.age} years` : null,
                  ]
                    .filter(Boolean)
                    .join(" • ")}
                </CardDescription>
              </div>
            </div>
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
                      router.push("/program/participants/" + participant.id)
                    }
                  >
                    View
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => {
                      setParticipant(participant);
                      setVisible(true);
                    }}
                  >
                    Update
                  </DropdownMenuItem>

                  <RoleAccess allow={(r) => r === "admin"}>
                    <DropdownMenuItem
                      className="text-destructive"
                      onClick={() => {
                        del.mutate(participant.id, {
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

          <CardContent className="space-y-4">
            {participant.phoneNumber && (
              <div className="flex items-center gap-2 text-sm">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span>{participant.phoneNumber}</span>
              </div>
            )}

            {participant.address && (
              <div className="flex items-start gap-2 text-sm">
                <MapPin className="mt-0.5 h-4 w-4 text-muted-foreground" />
                <span>{participant.address}</span>
              </div>
            )}

            {participant.affiliation && (
              <div className="flex items-start gap-2 text-sm">
                <BadgeInfo className="mt-0.5 h-4 w-4 text-muted-foreground" />
                <span>{participant.affiliation}</span>
              </div>
            )}

            {participant.parentDetails && (
              <div className="flex items-start gap-2 text-sm">
                <Users className="mt-0.5 h-4 w-4 text-muted-foreground" />
                <span>{participant.parentDetails}</span>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
      <UpdateParticipant
        participant={participant}
        open={visible}
        onOpenChange={setVisible}
      />
    </section>
  );
}

export default ParticipantView;
