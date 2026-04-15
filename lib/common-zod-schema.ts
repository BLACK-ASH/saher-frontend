import z from "zod";

export const dateField = z.union([z.string(), z.date(), z.null()])

export const userField = z.object({
  id: z.string(),
  name: z.string(),
  role: z.enum(["user", "manager", "admin"]),
  image: z.object({ src: z.string() })
})
