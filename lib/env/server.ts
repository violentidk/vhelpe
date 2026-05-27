import "server-only";
import { z } from "zod";

const serverEnvSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  SUPABASE_STORAGE_BUCKET: z.string().min(1).default("theses"),
  GEMINI_API_KEY: z.string().min(1),
  MAX_UPLOAD_MB: z.coerce.number().int().positive().max(50).default(12),
  MAX_ANALYSIS_CHUNKS: z.coerce.number().int().positive().max(200).default(60),
});

let cachedServerEnv: z.infer<typeof serverEnvSchema> | null = null;

export function getServerEnv() {
  if (cachedServerEnv) {
    return cachedServerEnv;
  }

  const parsed = serverEnvSchema.safeParse({
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    SUPABASE_STORAGE_BUCKET: process.env.SUPABASE_STORAGE_BUCKET,
    GEMINI_API_KEY: process.env.GEMINI_API_KEY,
    MAX_UPLOAD_MB: process.env.MAX_UPLOAD_MB,
    MAX_ANALYSIS_CHUNKS: process.env.MAX_ANALYSIS_CHUNKS,
  });

  if (!parsed.success) {
    const message = parsed.error.issues
      .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
      .join("; ");
    throw new Error(`Invalid server environment configuration: ${message}`);
  }

  cachedServerEnv = parsed.data;
  return cachedServerEnv;
}
