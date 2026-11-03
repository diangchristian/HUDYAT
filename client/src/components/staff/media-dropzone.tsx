import { useState } from "react";
import { useDropzone } from "react-dropzone";
import { UploadCloud } from "lucide-react";

import ProgressBar from "@/components/staff/progress-bar";
import type { MediaKind } from "@/api/teacher-api";
import { useUploadLessonMedia } from "@/hooks/use-upload-lesson-media";
import { cn } from "@/lib/utils";

// Matches the Cloudinary Free plan's limits.
const MAX_IMAGE_MB = 10;
const MAX_VIDEO_MB = 100;
const BYTES_PER_MB = 1024 * 1024;

const ACCEPTED_FILES = {
  "image/jpeg": [],
  "image/png": [],
  "image/webp": [],
  "video/mp4": [],
  "video/quicktime": [],
  "video/webm": [],
};

export default function MediaDropzone({
  signLabel,
  disabled,
  onUploaded,
}: {
  signLabel: string;
  disabled: boolean;
  onUploaded: (kind: MediaKind, url: string) => void;
}) {
  const [progress, setProgress] = useState(0);
  const [rejection, setRejection] = useState("");
  const upload = useUploadLessonMedia(setProgress);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: ACCEPTED_FILES,
    multiple: false,
    maxSize: MAX_VIDEO_MB * BYTES_PER_MB,
    disabled: disabled || upload.isPending,
    validator: (file) =>
      file.type?.startsWith("image/") && file.size > MAX_IMAGE_MB * BYTES_PER_MB
        ? { code: "file-too-large", message: "too large" }
        : null,
    onDropAccepted: ([file]) => {
      setRejection("");
      setProgress(0);
      if (file) {
        upload.mutate(file, {
          onSuccess: ({ kind, url }) => onUploaded(kind, url),
        });
      }
    },
    onDropRejected: () =>
      setRejection(
        `Choose a JPG, PNG or WebP image up to ${MAX_IMAGE_MB} MB, or an MP4, MOV or WebM video up to ${MAX_VIDEO_MB} MB.`,
      ),
  });

  const error = rejection || upload.error?.message;

  return (
    <div className="space-y-2">
      <div
        {...getRootProps({
          role: "button",
          "aria-label": `Upload an image or video for ${signLabel}`,
        })}
        className={cn(
          "flex cursor-pointer flex-col items-center gap-1 rounded-xl border-2 border-dashed border-input p-5 text-center text-sm transition-colors hover:bg-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
          isDragActive && "border-primary bg-accent",
          upload.isPending && "cursor-wait opacity-70",
        )}
      >
        <input {...getInputProps()} />
        <UploadCloud aria-hidden="true" className="size-6 text-muted-foreground" />
        <p className="font-bold">
          {upload.isPending
            ? "Uploading..."
            : "Drag an image or video here, or click to choose"}
        </p>
        <p className="text-muted-foreground">
          Images up to {MAX_IMAGE_MB} MB, videos up to {MAX_VIDEO_MB} MB
        </p>
      </div>

      {upload.isPending && (
        <ProgressBar
          value={progress}
          max={100}
          label={`Uploading media for ${signLabel}`}
        />
      )}

      {error && (
        <p role="alert" className="text-sm font-bold text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}
