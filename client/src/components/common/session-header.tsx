import { Link } from "react-router";

type SessionHeaderProps = {
  backTo?: string;
  backLabel?: string;
};

export default function SessionHeader({
  backTo = "/student/practice",
  backLabel = "Hudyat — back to practice categories",
}: SessionHeaderProps) {
  return (
    <header className="border-b border-border bg-background">
      <nav aria-label="Practice navigation" className="mx-auto flex h-18 max-w-5xl items-center px-5 sm:px-10">
        <Link
          to={backTo}
          aria-label={backLabel}
          className="inline-flex items-center gap-3 rounded-lg font-body text-3xl font-bold text-foreground focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
        >
          <span aria-hidden="true">🖐️</span>
          Hudyat
        </Link>
      </nav>
    </header>
  );
}
