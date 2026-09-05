import { apiFetch } from "@/lib/api-wrapper";
import { z } from "zod";

export const sessionSchema = z.object({
  sessionId: z.string(),
  device: z.string(),
  ip: z.string(),
  browser: z.string(),
  os: z.string(),
  current: z.boolean(),
  createdAt: z.number(),
  updatedAt: z.number(),
});

export type SessionT = z.infer<typeof sessionSchema>;

export const getSessions = async () => {
  const res = await apiFetch<SessionT[]>("/api/auth/sessions", {
    method: "GET",
  });
  return res.data;
};

export const revokeSession = async (sessionId: string) => {
  const res = await apiFetch(`/api/auth/sessions/revoke/${sessionId}`, {
    method: "GET",
  });
  return res.data;
};