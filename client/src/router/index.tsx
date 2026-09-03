import { createBrowserRouter } from "react-router";

import StudentPageLayout from "@/layouts/StudentPageLayout";
import StudentHomePage  from "@/pages/student/StudentHomePage";
import AssessmentPage from "@/pages/student/AssessmentPage";
import AssessmentResultPage from "@/pages/student/AssessmentResultPage";
import MyProgressPage from "@/pages/student/MyProgressPage";
import PracticePage from "@/pages/student/PracticePage";
import CategoryPracticePage from "@/pages/student/CategoryPracticePage";

import HomePage from "@/pages/HomePage";

import LoginPage from "@/pages/auth/LoginPage";
import TakeAssessmentPage from "@/pages/student/TakeAssessmentPage";
import NoSidebarLayout from "@/layouts/NoSidebarLayout";
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
      { path: "/student/practice", element: <PracticePage /> },
      { path: "/student/assessment", element: <AssessmentPage /> },
      { path: "/student/assessment/result", element: <AssessmentResultPage /> },
    ],
  },
  {
    element: <NoSidebarLayout />,
    children: [
      { path: "/student/assessment/1", element: <TakeAssessmentPage /> },
      { path: "/student/practice/:category", element: <CategoryPracticePage /> },
    ],
  },
  {
    path: "/login",
    element: <LoginPage />,
  },
]);
