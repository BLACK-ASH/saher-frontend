import { apiFetch } from "@/lib/api-wrapper";
import { toast } from "sonner";

type MailUser = {
  id: string;
  name: string;
  email: string;
  role: string;
  image: {
    id: string;
    src: string;
    alt: string;
  };
};

export type MailT = {
  id: string;
  from: MailUser;
  to: MailUser[];
  cc: MailUser[];
  bcc: MailUser[];
  subject: string;
  body: string;
  createdAt: Date;
};

type MailInput = {
  to: string[];
  cc: string[];
  bcc: string[];
  subject: string;
  body: string;
};

export const getSearchUser = async (keyword: string) => {
  const res = await apiFetch<MailUser[]>("/api/user/" + keyword, {
    method: "GET",
  });
  if (!res.success) toast.error(res.message);
  return res.data;
};

export const getMails = async () => {
  const res = await apiFetch<MailT[]>("/api/mail", {
    method: "GET",
  });
  if (!res.success) toast.error(res.message);
  return res.data;
};

export const getSentMails = async () => {
  const res = await apiFetch<MailT[]>("/api/mail/outbox", {
    method: "GET",
  });
  if (!res.success) toast.error(res.message);
  return res.data;
};

export const sendMail = async (data: MailInput) => {
  const res = await apiFetch<MailT>("/api/mail/", {
    method: "POST",
    body: JSON.stringify(data),
  });
  if (!res.success) toast.error(res.message);
  return res;
};
