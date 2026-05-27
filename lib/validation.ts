import { z } from "zod";
const isoDateRegex = /^\d{4}-\d{2}-\d{2}$/;

export const mentorRequestSchema = z.object({
  message: z.string().trim().min(5).max(3000),
});

export const selfEvaluationSchema = z.object({
  answers: z
    .array(z.number().int().min(1).max(5))
    .length(4),
});

export const plannerTaskCreateSchema = z.object({
  title: z.string().trim().min(2).max(200),
  deadline: z.string().regex(isoDateRegex, "Invalid date format, expected YYYY-MM-DD"),
  progress: z.number().int().min(0).max(100).optional(),
  status: z.enum(["todo", "in_progress", "done"]).optional(),
});

export const plannerTaskPatchSchema = z.object({
  title: z.string().trim().min(2).max(200).optional(),
  deadline: z
    .string()
    .regex(isoDateRegex, "Invalid date format, expected YYYY-MM-DD")
    .optional(),
  progress: z.number().int().min(0).max(100).optional(),
  status: z.enum(["todo", "in_progress", "done"]).optional(),
});
