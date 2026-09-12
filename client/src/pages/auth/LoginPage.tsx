import { useState } from "react";
import { useNavigate } from "react-router";

import ElevatedButton from "@/components/ui/elavated-button";
import { Input } from "@/components/ui/input";
import { Eye, EyeOff, Lock, MoveLeft, User } from "lucide-react";

import { login } from "@/api/auth-api";
import { isStandalonePwa } from "@/lib/pwa";

const LoginPage = () => {
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const { token } = await login(username, password);

      localStorage.setItem("token", token);

      // Redirect to Student Home after successful login
      navigate("/student/home");
    } catch (loginError) {
      setError(
        loginError instanceof Error
          ? loginError.message
          : "Unable to log in.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-white px-4">
      {/* Back Button */}
      {!isStandalonePwa() && (
        <div className="pt-4">
          <ElevatedButton
            text="Back"
            variant="secondary"
            size="md"
            onClick={() => navigate("/")}
            icon={MoveLeft}
            iconPosition="left"
          />
        </div>
      )}

      <div className="flex-1 flex items-center justify-center">
        <div className="w-full max-w-md flex flex-col items-center gap-8">
          {/* Welcome Section */}
          <div className="flex flex-col items-center gap-4">
            <h1 className="text-4xl md:text-5xl font-bold font-body text-foreground text-center">
              Welcome to Hudyat
            </h1>
          </div>

          {/* Login Form */}
          <form
            onSubmit={handleLogin}
            className="w-full flex flex-col gap-6"
          >
            <div className="flex flex-col gap-2">
              <h2 className="text-2xl font-bold font-body text-foreground text-center">
                Log in
              </h2>
            </div>

            {/* Username Input */}
            <div className="space-y-2">
              <div className="relative">
                <User
                  aria-hidden="true"
                  className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-muted-foreground"
                />

                <Input
                  placeholder="Username"
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  disabled={isSubmitting}
                  className="py-6 pl-12 pr-4 border-3 font-body font-bold text-base"
                />
              </div>
            </div>

            {error && (
              <p
                className="text-center text-sm font-bold text-red-600"
                role="alert"
              >
                {error}
              </p>
            )}

            {/* Password Input */}
            <div className="space-y-2">
              <div className="relative">
                <Lock
                  aria-hidden="true"
                  className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-muted-foreground"
                />

                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isSubmitting}
                  className="py-6 pl-12 pr-12 border-3 font-body font-bold text-lg"
                />

                <button
                  type="button"
                  onClick={() => setShowPassword((current) => !current)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                >
                  {showPassword ? (
                    <EyeOff aria-hidden="true" className="size-5" />
                  ) : (
                    <Eye aria-hidden="true" className="size-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Login Button */}
            <ElevatedButton
              text={isSubmitting ? "LOGGING IN..." : "LOG IN"}
              variant="primary"
              size="lg"
              className="w-full"
              disabled={isSubmitting}
              type="submit"
            />
          </form>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;