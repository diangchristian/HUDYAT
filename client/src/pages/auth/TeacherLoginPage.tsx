import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { ArrowRight, Eye, EyeOff } from "lucide-react";

import { StaffCard } from "@/components/staff/staff-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { teacherLogin } from "@/api/auth-api";
import { useStaffTheme } from "@/hooks/use-staff-theme";

const TeacherLoginPage = () => {
  useStaffTheme();
  const navigate = useNavigate();

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);

    if (!identifier.trim() || !password) {
      setError("Enter your username and password.");
      return;
    }

    setIsSubmitting(true);
    try {
      const { token } = await teacherLogin(identifier.trim(), password);
      localStorage.setItem("token", token);
      navigate("/teacher/dashboard");
    } catch (loginError) {
      setError(
        loginError instanceof Error ? loginError.message : "Unable to log in.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/40 px-4 py-10 font-staff">
      <StaffCard className="w-full max-w-md p-8 sm:p-10">
        <div className="flex flex-col items-center text-center">
          <span
            aria-hidden="true"
            className="flex size-20 items-center justify-center rounded-full bg-staff-brand font-body text-4xl font-black text-white"
          >
            H
          </span>
          <h1 className="mt-4 font-body text-4xl font-black tracking-tight text-foreground">
            HUDYAT
          </h1>
          <p className="mt-1 text-sm font-semibold text-muted-foreground">
            Teacher Portal
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 space-y-5" noValidate>
          <h2 className="font-body text-xl font-bold text-foreground">Log in</h2>

          <div className="space-y-2">
            <Label htmlFor="identifier" className="font-bold">
              Username
            </Label>
            <Input
              id="identifier"
              autoComplete="username"
              placeholder="Enter your username or email"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              disabled={isSubmitting}
              className="h-12 rounded-xl px-4 text-base"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="font-bold">
              Password
            </Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isSubmitting}
                className="h-12 rounded-xl px-4 pr-12 text-base"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => setShowPassword((current) => !current)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                className="absolute top-1/2 right-2 -translate-y-1/2 text-muted-foreground"
              >
                {showPassword ? (
                  <EyeOff aria-hidden="true" />
                ) : (
                  <Eye aria-hidden="true" />
                )}
              </Button>
            </div>
          </div>

          {error && (
            <p role="alert" className="text-sm font-bold text-red-600">
              {error}
            </p>
          )}

          <Button
            type="submit"
            disabled={isSubmitting}
            className="h-12 w-full rounded-full text-base font-bold"
          >
            {isSubmitting ? "Logging in..." : "Log in"}
            {!isSubmitting && <ArrowRight aria-hidden="true" />}
          </Button>
        </form>

        <Separator className="my-6" />

        <div className="space-y-1 text-center text-sm text-muted-foreground">
          <p>Need support? Contact your administrator.</p>
          <p>
            Are you a student?{" "}
            <Link
              to="/login"
              className="font-bold text-primary underline-offset-4 hover:underline"
            >
              Student log in
            </Link>
          </p>
        </div>
      </StaffCard>
    </main>
  );
};

export default TeacherLoginPage;
