import z from "zod";

export const dateField = z.union([z.string().datetime(), z.date(), z.null()])
  .transform((val) => {
    if (val === null || val === undefined) return null;
    return new Date(val);
  });

