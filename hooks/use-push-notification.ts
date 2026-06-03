"use client";

import { apiFetch } from "@/lib/api-wrapper";

export const registerPush = async () => {
  if (!("serviceWorker" in navigator)) return;

  const permission = await Notification.requestPermission();

  if (permission !== "granted") return;

  const registration = await navigator.serviceWorker.register("/sw.js");

  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
  });

  await apiFetch("/api/notification/subscribe", {
    method: "POST",
    body: JSON.stringify(subscription),
  });
};
