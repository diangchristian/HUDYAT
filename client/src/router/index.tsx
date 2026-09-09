import { createBrowserRouter } from "react-router";

import StudentPageLayout from "@/layouts/StudentPageLayout";
import NoSidebarLayout from "@/layouts/NoSidebarLayout";
import { RequireGuest, RequireRole } from "./route-guards";

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
import SettingsPage from "@/pages/student/SettingsPage";

export const router = createBrowserRouter([
  // =========================
  // PUBLIC ROUTES (guests only — a logged-in user is redirected away)
  // =========================
  {
    element: <RequireGuest />,
    children: [
      {
        path: "/",
        element: <HomePage />,
      },
      {
        path: "/login",
        element: <LoginPage />,
      },
    ],
  },

  // =========================
  // STUDENT ROUTES (LEARNER role only)
  // =========================
  {
    element: <RequireRole allowedRoles={["LEARNER"]} />,
    children: [
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
          {
            path: "/student/settings",
            element: <SettingsPage />,
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
    ],
  },
]);