import { Link } from "react-router";

import { teacherLogin } from "@/api/auth-api";
import StaffLoginPage from "./StaffLoginPage";

const TeacherLoginPage = () => (
  <StaffLoginPage
    portalName="Teacher Portal"
    homePath="/teacher/dashboard"
    logIn={teacherLogin}
    footer={
      <>
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
      </>
    }
  />
);

export default TeacherLoginPage;
