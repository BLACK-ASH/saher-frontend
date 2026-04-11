import z from "zod";

export const dateField = z.union([z.string(), z.date(), z.null()])
  .transform((val) => {
    if (val === null || val === undefined) return null;
    return new Date(val);
  });

export const userField = z.union([z.string(),
  z.object({
    id:z.string(),
    name:z.string(),
    role:z.enum(["user","manager","admin"])
  })
])
