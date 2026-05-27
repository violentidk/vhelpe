"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { FileUp, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function UploadZone() {
  const MAX_PLATFORM_UPLOAD_MB = 4;
  const [file, setFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const acceptedText = useMemo(() => "Supported: PDF, DOCX", []);

  const onDropFile = (incoming: File | null) => {
    if (!incoming) return;
    const extension = incoming.name.split(".").pop()?.toLowerCase();
    if (!["pdf", "docx"].includes(extension || "")) {
      setError("Only PDF and DOCX files are supported.");
      return;
    }
    if (incoming.size > MAX_PLATFORM_UPLOAD_MB * 1024 * 1024) {
      setError(
        `File is too large for direct upload on Vercel serverless (${MAX_PLATFORM_UPLOAD_MB}MB max request body).`,
      );
      return;
    }

    setError(null);
    setFile(incoming);
  };

  const onUpload = async () => {
    if (!file) return;

    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/thesis/analyze", {
        method: "POST",
        body: formData,
      });

      const rawBody = await response.text();
      let data: { error?: string; analysis_id?: string } = {};
      try {
        data = rawBody ? (JSON.parse(rawBody) as typeof data) : {};
      } catch {
        if (!response.ok) {
          throw new Error(
            rawBody.startsWith("Request Entity Too Large")
              ? `Upload rejected by platform limit. Keep file under ${MAX_PLATFORM_UPLOAD_MB}MB or switch to direct-to-storage upload.`
              : rawBody || "Upload failed.",
          );
        }
      }

      if (!response.ok) {
        throw new Error(data.error || "Upload failed.");
      }

      router.push(`/analysis/${data.analysis_id}`);
      router.refresh();
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "Upload failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Thesis Upload</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <motion.div
          className={`rounded-2xl border-2 border-dashed p-10 text-center transition ${
            dragOver ? "border-primary bg-primary/10" : "border-border"
          }`}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            onDropFile(e.dataTransfer.files[0] ?? null);
          }}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <FileUp className="mx-auto mb-3 h-10 w-10 text-primary" />
          <p className="mb-2 font-medium">Drag and drop thesis file</p>
          <p className="mb-4 text-sm text-muted-foreground">{acceptedText}</p>
          <input
            id="upload-input"
            type="file"
            className="hidden"
            accept=".pdf,.docx"
            onChange={(e) => onDropFile(e.target.files?.[0] ?? null)}
          />
          <Button variant="outline" onClick={() => document.getElementById("upload-input")?.click()}>
            Choose file
          </Button>
          {file && <p className="mt-3 text-sm text-card-foreground">Selected: {file.name}</p>}
        </motion.div>

        <Button disabled={!file || loading} onClick={onUpload} className="w-full">
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Analyzing thesis...
            </>
          ) : (
            "Upload and Analyze"
          )}
        </Button>
        {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
      </CardContent>
    </Card>
  );
}
