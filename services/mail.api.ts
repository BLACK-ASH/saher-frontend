import { apiFetch } from "@/lib/api-wrapper";
import { normalizeList } from "@/lib/normalize-list";
import z from "zod";

export const mailUserSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string(),
  role: z.string(),
  image: z.object({ id: z.string(), src: z.string(), alt: z.string() }),
});

export type MailUser = z.infer<typeof mailUserSchema>;

export const inboxMailSchema = z.object({
  id: z.string(),
  from: mailUserSchema,
  to: z.array(mailUserSchema),
  cc: z.array(mailUserSchema),
  subject: z.string(),
  body: z.string(),
  createdAt: z.string(),
});

export type InboxMailT = z.infer<typeof inboxMailSchema>;

export const outboxMailSchema = inboxMailSchema.extend({
  bcc: z.array(mailUserSchema),
});

export type OutboxMailT = z.infer<typeof outboxMailSchema>;

export const sendMailSchema = z.object({
  to: z.array(z.string()).min(1),
  cc: z.array(z.string()).optional(),
  bcc: z.array(z.string()).optional(),
  subject: z.string().min(1),
  body: z.string().min(1),
});

export type SendMailInput = z.infer<typeof sendMailSchema>;

export const getSearchUser = async (keyword: string) => {
  const res = await apiFetch<MailUser[]>("/api/user/" + keyword, {
    method: "GET",
  });
  return res.data;
};

export const getMails = async ({
  page = 1,
  limit = 10,
}: { page?: number; limit?: number } = {}) => {
  const res = await apiFetch<InboxMailT[]>(
    `/api/mail?page=${page}&limit=${limit}`,
    {
      method: "GET",
    },
  );
  return normalizeList<InboxMailT>(res);
};

export const getSentMails = async ({
  page = 1,
  limit = 10,
}: { page?: number; limit?: number } = {}) => {
  const res = await apiFetch<OutboxMailT[]>(
    `/api/mail/outbox?page=${page}&limit=${limit}`,
    {
      method: "GET",
    },
  );
  return normalizeList<OutboxMailT>(res);
};

// Backend returns data: null on success — only the envelope matters.
export const sendMail = async (data: SendMailInput) => {
  const res = await apiFetch<{ success: boolean; message: string }>(
    "/api/mail/",
    {
      method: "POST",
      body: JSON.stringify(data),
    },
  );
  return res;
};
