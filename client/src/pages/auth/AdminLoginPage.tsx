import { Link } from "react-router";

import { adminLogin } from "@/api/auth-api";
import StaffLoginPage from "./StaffLoginPage";

const AdminLoginPage = () => (
  <StaffLoginPage
    portalName="Admin Console"
    homePath="/admin/overview"
    logIn={adminLogin}
    variant="admin"
    footer={
      <p>
        Are you a teacher?{" "}
        <Link
          to="/teacher/login"
          className="font-bold text-primary underline-offset-4 hover:underline"
        >
          Teacher log in
        </Link>
      </p>
    }
  />
);

export default AdminLoginPage;
