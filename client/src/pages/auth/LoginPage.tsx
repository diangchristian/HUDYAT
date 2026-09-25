import { Link, useNavigate } from "react-router";

import LoginScreen from "@/components/common/login-screen";
import { login } from "@/api/auth-api";

const LoginPage = () => {
  const navigate = useNavigate();

  const handleLogin = async (identifier: string, password: string) => {
    const { token } = await login(identifier, password);

    localStorage.setItem("token", token);

    // Redirect to Student Home after successful login
    navigate("/student/home");
  };

  return (
    <LoginScreen
      heading="Log in"
      identifierPlaceholder="Username"
      onLogin={handleLogin}
      footer={
        <p className="text-sm font-body text-muted-foreground">
          Are you a teacher?{" "}
          <Link
            to="/teacher/login"
            className="font-bold text-foreground underline underline-offset-4"
          >
            Log in here
          </Link>
        </p>
      }
    />
  );
};

export default LoginPage;
