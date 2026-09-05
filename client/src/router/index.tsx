import { createBrowserRouter } from "react-router";

import StudentPageLayout from "@/layouts/StudentPageLayout";
import NoSidebarLayout from "@/layouts/NoSidebarLayout";

import HomePage from "@/pages/HomePage";
import LoginPage from "@/pages/auth/LoginPage";

import StudentHomePage from "@/pages/student/StudentHomePage";
import LearnPage from "@/pages/student/LearnPage";
import CategoryLearnPage from "@/pages/student/CategoryLearnPage";
import PracticePage from "@/pages/student/PracticePage";
import CategoryPracticePage from "@/pages/student/CategoryPracticePage";
import MyProgressPage from "@/pages/student/MyProgressPage";
import AssessmentPage from "@/pages/student/AssessmentPage";
import AssessmentResultPage from "@/pages/student/AssessmentResultPage";
import TakeAssessmentPage from "@/pages/student/TakeAssessmentPage";

export const router = createBrowserRouter([
  // =========================
  // PUBLIC ROUTES
  // =========================
  {
    path: "/",
    element: <HomePage />,
  },
  {
    path: "/login",
    element: <LoginPage />,
  },

  // =========================
  // STUDENT ROUTES
  // =========================
  {
    element: <StudentPageLayout />,
    children: [
      {
        path: "/student/home",
        element: <StudentHomePage />,
      },
      {
        path: "/student/learn",
        element: <LearnPage />,
      },
      {
        path: "/student/progress",
        element: <MyProgressPage />,
      },
      {
        path: "/student/practice",
        element: <PracticePage />,
      },
      {
        path: "/student/assessment",
        element: <AssessmentPage />,
      },
      {
        path: "/student/assessment/result",
        element: <AssessmentResultPage />,
      },
    ],
  },

  // =========================
  // STUDENT FULL-SCREEN ROUTES
  // =========================
  {
    element: <NoSidebarLayout />,
    children: [
      {
        path: "/student/assessment/:categoryId",
        element: <TakeAssessmentPage />,
      },
      {
        path: "/student/learn/:category",
        element: <CategoryLearnPage />,
      },
      {
        path: "/student/practice/:category",
        element: <CategoryPracticePage />,
      },
    ],
  },
]);