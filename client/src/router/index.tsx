import { createBrowserRouter } from "react-router";

import StudentPageLayout from "@/layouts/StudentPageLayout";
import { StudentHomePage } from "@/pages/student/StudentHomePage";

import HomePage from "@/pages/HomePage";

import LoginPage from "@/pages/auth/LoginPage";
export const router = createBrowserRouter([
{
    path: "/",
    element: <HomePage />,
  },
  {
    element: <StudentPageLayout />,
    children: [
      { path: "/student/home", element: <StudentHomePage /> }
    ],
  },
  {
    path: "/login",
    element: <LoginPage />,
  },
]);