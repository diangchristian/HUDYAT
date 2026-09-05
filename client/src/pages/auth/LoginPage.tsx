import { useState } from "react";
import { useNavigate } from "react-router";

import ElevatedButton from "@/components/ui/elavated-button";
import { Input } from "@/components/ui/input";
import { MoveLeft } from "lucide-react";

const LoginPage = () => {
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL ?? "http://localhost:5001"}/api/auth/login`,
        {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: username, password }),
        },
      );

      const body = (await response.json()) as {
        message?: string;
        data?: { token?: string };
      };

      if (!response.ok || !body.data?.token) {
        throw new Error(body.message ?? "Unable to log in.");
      }

      localStorage.setItem("token", body.data.token);

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

      <div className="flex-1 flex items-center justify-center">
        <div className="w-full max-w-md flex flex-col items-center gap-8">
          {/* Welcome Section */}
          <div className="flex flex-col items-center gap-4">
            {/* <span className="text-6xl">👋</span> */}

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
              <Input
                placeholder="Username"
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="py-6 px-4 border-3 font-body font-bold text-base"
              />
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
              <Input
                id="password"
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="py-6 px-4 border-3 font-body font-bold text-lg"
              />
            </div>

            {/* Login Button */}
            <ElevatedButton
              text="LOG IN"
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