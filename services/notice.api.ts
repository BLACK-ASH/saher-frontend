import { apiFetch } from "@/lib/api-wrapper";
import { z } from "zod";

// Mirrors backend notice.schema.ts / notice.model.ts exactly (D-20).
export const noticeSchema = z.object({
  _id: z.string(),
  title: z.string(),
  description: z.string(),
  expiresAt: z.string(),
  isDeleted: z.boolean().optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

export type NoticeResponse = z.infer<typeof noticeSchema>;

export const createNoticeSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  expiresAt: z.string().optional(),
});

export type CreateNoticeInput = z.infer<typeof createNoticeSchema>;

// GET /notice — returns the raw array; backend sends no pagination meta,
// so envelope list-normalization helpers must NOT be used here.
export const getNotices = async (): Promise<NoticeResponse[]> => {
  const res = await apiFetch<NoticeResponse[]>("/api/notice", {
    method: "GET",
  });
  return res.data;
};

// POST /notice — backend adds +1 day to a provided expiresAt (D-11).
export const createNotice = async (data: CreateNoticeInput) => {
  const res = await apiFetch<NoticeResponse>("/api/notice", {
    method: "POST",
    body: JSON.stringify(data),
  });
  return res.data;
};

// PUT /notice/:id — returns the OLD doc (backend uses new:false); callers
// must invalidate the notices cache instead of trusting this response.
export const updateNotice = async (
  id: string,
  data: Partial<CreateNoticeInput>,
) => {
  const res = await apiFetch<NoticeResponse>(`/api/notice/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
  return res.data;
};

// DELETE /notice/:id — soft delete (sets isDeleted).
export const deleteNotice = async (id: string) => {
  await apiFetch(`/api/notice/${id}`, { method: "DELETE" });
};

// PATCH /notice/:id/restore — clears the soft-delete flag.
export const restoreNotice = async (id: string) => {
  await apiFetch(`/api/notice/${id}/restore`, { method: "PATCH" });
};

// DELETE /notice/:id/permanent — irrecoverable (findByIdAndDelete).
export const permanentDeleteNotice = async (id: string) => {
  await apiFetch(`/api/notice/${id}/permanent`, { method: "DELETE" });
};
