import { createBrowserRouter } from "react-router";

import StudentPageLayout from "@/layouts/StudentPageLayout";
import { StudentHomePage } from "@/pages/student/StudentHomePage";
import MyProgressPage from "@/pages/student/MyProgressPage";

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
      { path: "/student/home", element: <StudentHomePage /> },
      { path: "/student/progress", element: <MyProgressPage /> },
    ],
  },
  {
    path: "/login",
    element: <LoginPage />,
  },
]);
