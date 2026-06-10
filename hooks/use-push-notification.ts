"use client";

import { apiFetch } from "@/lib/api-wrapper";

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);

  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");

  const rawData = window.atob(base64);

  return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)));
}

export const registerPush = async () => {
  if (!("serviceWorker" in navigator)) return;

  const permission = await Notification.requestPermission();

  if (permission !== "granted") return;

  const registration = await navigator.serviceWorker.register("/sw.js");

  try {
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(
        process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
      ),
    });

    await apiFetch("/api/notification/subscribe", {
      method: "POST",
      body: JSON.stringify(subscription),
    });
  } catch (error) {
    console.error(error);
  }
};
