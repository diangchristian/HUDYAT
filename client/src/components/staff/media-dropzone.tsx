import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useDropzone } from "react-dropzone";
import { UploadCloud } from "lucide-react";

import ProgressBar from "@/components/staff/progress-bar";
import {
  MEDIA_UPLOAD_KEY,
  uploadLessonMedia,
  type MediaKind,
} from "@/api/teacher-api";
import { cn } from "@/lib/utils";

// Matches the Cloudinary Free plan's limits.
const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
const MAX_VIDEO_BYTES = 100 * 1024 * 1024;

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
  onUploaded,
}: {
  signLabel: string;
  onUploaded: (kind: MediaKind, url: string) => void;
}) {
  const [progress, setProgress] = useState(0);
  const [rejection, setRejection] = useState("");

  const upload = useMutation({
    mutationKey: MEDIA_UPLOAD_KEY,
    mutationFn: (file: File) => uploadLessonMedia(file, setProgress),
    onSuccess: ({ kind, url }) => onUploaded(kind, url),
  });

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: ACCEPTED_FILES,
    multiple: false,
    maxSize: MAX_VIDEO_BYTES,
    disabled: upload.isPending,
    validator: (file) =>
      file.type?.startsWith("image/") && file.size > MAX_IMAGE_BYTES
        ? { code: "file-too-large", message: "too large" }
        : null,
    onDropAccepted: ([file]) => {
      setRejection("");
      setProgress(0);
      if (file) upload.mutate(file);
    },
    onDropRejected: () =>
      setRejection(
        "Choose a JPG, PNG or WebP image up to 10 MB, or an MP4, MOV or WebM video up to 100 MB.",
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
            ? `Uploading... ${progress}%`
            : "Drag an image or video here, or click to choose"}
        </p>
        <p className="text-muted-foreground">
          Images up to 10 MB, videos up to 100 MB
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
