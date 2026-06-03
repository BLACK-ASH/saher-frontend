"use client";

import { useEffect, useState } from "react";
import { Bell, BellOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { toast } from "sonner";
import { registerPush } from "@/hooks/use-push-notification";
import { apiFetch } from "@/lib/api-wrapper";

type Props = {
  dbEnabled: boolean;
};

export function NotificationCard({ dbEnabled }: Props) {
  const [loading, setLoading] = useState(false);
  const [realEnabled, setRealEnabled] = useState<boolean | null>(null);

  // check real browser state
  useEffect(() => {
    const check = async () => {
      if (!("serviceWorker" in navigator)) return;

      const reg = await navigator.serviceWorker.getRegistration();
      const sub = await reg?.pushManager.getSubscription();

      setRealEnabled(!!sub);
    };

    check();
  }, []);

  const enable = async () => {
    try {
      setLoading(true);

      if (Notification.permission === "denied") {
        toast.error("Notifications are blocked in browser settings");
        return;
      }

      await registerPush();

      await apiFetch("/api/notification/enable", {
        method: "POST",
      });

      setRealEnabled(true);
      toast.success("Notifications enabled");
    } catch {
      toast.error("Failed to enable notifications");
    } finally {
      setLoading(false);
    }
  };

  const disable = async () => {
    try {
      setLoading(true);

      const reg = await navigator.serviceWorker.getRegistration();
      const sub = await reg?.pushManager.getSubscription();

      if (sub) {
        await sub.unsubscribe(); // 👈 THIS removes browser permission binding
      }

      await apiFetch("/api/notification/disable", {
        method: "POST",
      });

      setRealEnabled(false);
      toast.success("Notifications disabled");
    } catch {
      toast.error("Failed to disable notifications");
    } finally {
      setLoading(false);
    }
  };

  const enabled = dbEnabled && realEnabled;

  return (
    <Alert>
      {enabled ? <Bell /> : <BellOff />}

      <AlertTitle>
        {enabled ? "Notifications Enabled" : "Notifications Disabled"}
      </AlertTitle>

      <AlertDescription className="space-y-3">
        <p>Get updates about attendance, announcements and reports.</p>

        {enabled ? (
          <Button variant="destructive" onClick={disable} disabled={loading}>
            {loading ? "Disabling..." : "Disable Notifications"}
          </Button>
        ) : (
          <Button onClick={enable} disabled={loading}>
            {loading ? "Enabling..." : "Enable Notifications"}
          </Button>
        )}
      </AlertDescription>
    </Alert>
  );
}
