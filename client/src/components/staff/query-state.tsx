import type { ReactNode } from "react";
import { Loader2, RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";

type QueryStateProps = {
  isLoading: boolean;
  error: unknown;
  loadingText: string;
  errorText: string;
  onRetry: () => void;
  /** Layout placeholder shown instead of the spinner while loading. */
  skeleton?: ReactNode;
};

/*
 * The loading placeholder / error-with-retry block pages show while a
 * query hasn't produced data. Renders nothing once it has.
 */
export default function QueryState({
  isLoading,
  error,
  loadingText,
  errorText,
  onRetry,
  skeleton,
}: QueryStateProps) {
  if (isLoading && skeleton) {
    return (
      <div role="status" className="space-y-6">
        <span className="sr-only">{loadingText}</span>
        {skeleton}
      </div>
    );
  }

  if (isLoading) {
    return (
      <div
        role="status"
        className="mt-12 flex flex-col items-center justify-center gap-3 text-center"
      >
        <Loader2
          aria-hidden="true"
          className="size-8 animate-spin text-primary"
        />
        <p className="text-sm font-semibold text-muted-foreground">
          {loadingText}
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div
        role="alert"
        className="mx-auto mt-12 max-w-md rounded-2xl border border-red-200 bg-red-50 p-6 text-center"
      >
        <p className="font-semibold text-red-700">
          {error instanceof Error ? error.message : errorText}
        </p>
        <Button
          variant="outline"
          className="mt-4 h-9 rounded-full px-4"
          onClick={onRetry}
        >
          <RefreshCw aria-hidden="true" />
          Try again
        </Button>
      </div>
    );
  }

  return null;
}
