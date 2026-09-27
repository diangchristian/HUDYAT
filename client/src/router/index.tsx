import { createBrowserRouter, Navigate } from "react-router";

import StudentPageLayout from "@/layouts/StudentPageLayout";
import NoSidebarLayout from "@/layouts/NoSidebarLayout";
import TeacherPageLayout from "@/layouts/TeacherPageLayout";
import { RequireGuest, RequireRole } from "./route-guards";

import HomePage from "@/pages/HomePage";
import LoginPage from "@/pages/auth/LoginPage";
import TeacherLoginPage from "@/pages/auth/TeacherLoginPage";

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

import TeacherDashboardPage from "@/pages/teacher/TeacherDashboardPage";
import LessonsPage from "@/pages/teacher/LessonsPage";
import QuizzesPage from "@/pages/teacher/QuizzesPage";
import QuizEditorPage from "@/pages/teacher/QuizEditorPage";
import StudentsPage from "@/pages/teacher/StudentsPage";
import StudentDetailPage from "@/pages/teacher/StudentDetailPage";
import TeacherSettingsPage from "@/pages/teacher/TeacherSettingsPage";

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
      {
        path: "/teacher/login",
        element: <TeacherLoginPage />,
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
            path: "/student/learn/:categoryId",
            element: <CategoryLearnPage />,
          },
          {
            path: "/student/practice/:categoryId",
            element: <CategoryPracticePage />,
          },
        ],
      },
    ],
  },

  // =========================
  // TEACHER ROUTES (TEACHER role only)
  // =========================
  {
    element: (
      <RequireRole allowedRoles={["TEACHER"]} loginPath="/teacher/login" />
    ),
    children: [
      {
        element: <TeacherPageLayout />,
        children: [
          {
            path: "/teacher",
            element: <Navigate to="/teacher/dashboard" replace />,
          },
          {
            path: "/teacher/dashboard",
            element: <TeacherDashboardPage />,
          },
          {
            path: "/teacher/lessons",
            element: <LessonsPage />,
          },
          {
            path: "/teacher/quizzes",
            element: <QuizzesPage />,
          },
          {
            path: "/teacher/quizzes/:categoryId",
            element: <QuizEditorPage />,
          },
          {
            path: "/teacher/students",
            element: <StudentsPage />,
          },
          {
            path: "/teacher/students/:learnerId",
            element: <StudentDetailPage />,
          },
          {
            path: "/teacher/settings",
            element: <TeacherSettingsPage />,
          },
        ],
      },
    ],
  },
]);
