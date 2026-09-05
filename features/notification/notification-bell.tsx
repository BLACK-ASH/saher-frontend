"use client";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useNotification } from "@/hooks/use-notification";
import NotificationBox from "./notification-box";

export function NotificationBell() {
  const { unseen } = useNotification();
  const unseenCount = unseen.data ?? 0;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative" aria-label="Notifications">
          <Bell className="size-5" />
          {unseenCount > 0 && (
            <Badge className="absolute -top-1 -right-1 size-5 justify-center rounded-full p-0 text-[10px]">
              {unseenCount > 99 ? "99+" : unseenCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[26rem] p-0">
        <NotificationBox />
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
