import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BellIcon,
  CircleAlert,
  CircleCheck,
  CircleQuestionMark,
  CircleX,
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { success } from "zod";
import { ScrollArea } from "@/components/ui/scroll-area";

type Props = {};

const NotificationBox = (props: Props) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-3">
          <BellIcon className="size-4" />
          notifications
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-60">
          <Notification type="info" title="info" description="just testing" />
          <Notification
            type="success"
            title="success"
            description="just testing"
          />
          <Notification type="warn" title="warn" description="just testing" />
          <Notification type="error" title="error" description="just testing" />
          <Notification type="info" title="info" description="just testing" />
          <Notification
            type="success"
            title="success"
            description="just testing"
          />
          <Notification type="warn" title="warn" description="just testing" />
          <Notification type="error" title="error" description="just testing" />
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

type NotificationProps = {
  type: "info" | "success" | "warn" | "error";
  title: string;
  description: string;
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
}: NotificationProps) => {
  const Icon = notificationIcons[type];

  return (
    <Alert variant={type} className="m-2 w-[95%]">
      <Icon />
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription>{description}</AlertDescription>
    </Alert>
  );
};

export default NotificationBox;
