"use client";
import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  BellIcon,
  CircleAlert,
  CircleCheck,
  CircleQuestionMark,
  CircleX,
  RotateCw,
} from "lucide-react";
import {
  Alert,
  AlertAction,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useNotification } from "@/hooks/use-notification";
import { DefaultLoader } from "@/components/loading";
import { NoData } from "@/components/no-data";
import { Button } from "@/components/ui/button";
import Link from "next/link";

const NotificationBox = () => {
  const { list, unseen, markSeen } = useNotification();
  const { data, isLoading, isError, refetch, isRefetching } = list;
  const notifications = data ?? [];

  if (isLoading) return <DefaultLoader />;
  if (isError)
    return <NoData title="Failed To Load Notifications" description="" />;
  if (notifications.length === 0) return <NoData title="No Notification To Show" description="" />;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-3">
          <BellIcon className="size-4" />
          notifications
          <Badge variant={unseen.data && unseen.data > 0 ? "default" : "secondary"}>
            {unseen.data ?? 0}
          </Badge>
        </CardTitle>
        <CardAction>
          <Button
            variant={"outline"}
            disabled={isRefetching}
            onClick={() => refetch()}
          >
            <RotateCw />
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-60">
          {notifications.length > 0 &&
            notifications.map((notification) => {
              return (
                <div
                  key={notification.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => !notification.isSeen && markSeen.mutate(notification.id)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !notification.isSeen) {
                      markSeen.mutate(notification.id);
                    }
                  }}
                >
                  <Notification
                    type={notification.type}
                    title={notification.title}
                    description={notification.description}
                    action={notification.action}
                    isSeen={notification.isSeen}
                  />
                </div>
              );
            })}
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

type NotificationProps = {
  type: "info" | "success" | "warn" | "error";
  title: string;
  description: string;
  readonly isSeen?: boolean | undefined;
  readonly action?:
    | {
        type: "download" | "navigate" | "external" | "none";
        label: string;
        url: string;
        method: "GET" | "POST" | "PATCH" | "DELETE";
      }
    | undefined;
};

const notificationIcons = {
  info: CircleQuestionMark,
  success: CircleCheck,
  warn: CircleAlert,
  error: CircleX,
};

const Notification = ({
  type = "info",
  title,
  description,
  action,
  isSeen = false,
}: NotificationProps) => {
  const Icon = notificationIcons[type];

  return (
    <Alert
      variant={type}
      className={`m-2 w-[95%] ${isSeen ? "opacity-60" : "border-l-2 border-l-primary"}`}
    >
      <Icon />
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription>{description}</AlertDescription>
      {action && action.type !== "none" ? (
        <AlertAction>
          {action.type === "download" && (
            <Button asChild>
              <a href={action.url} target="_blank" rel="noreferrer">
                {action.label}
              </a>
            </Button>
          )}

          {action.type === "external" && (
            <Button asChild>
              <a target="_blank" href={action.url}>
                {action.label}
              </a>
            </Button>
          )}

          {action.type === "navigate" && (
            <Button asChild>
              <Link href={action.url}>{action.label}</Link>
            </Button>
          )}
        </AlertAction>
      ) : null}
    </Alert>
  );
};

export default NotificationBox;
