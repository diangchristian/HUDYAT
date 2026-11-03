import { createBrowserRouter, Navigate } from "react-router";

import StudentPageLayout from "@/layouts/StudentPageLayout";
import NoSidebarLayout from "@/layouts/NoSidebarLayout";
import TeacherPageLayout from "@/layouts/TeacherPageLayout";
import AdminPageLayout from "@/layouts/AdminPageLayout";
import { RequireGuest, RequireRole } from "./route-guards";

import HomePage from "@/pages/HomePage";
import LoginPage from "@/pages/auth/LoginPage";
import TeacherLoginPage from "@/pages/auth/TeacherLoginPage";
import AdminLoginPage from "@/pages/auth/AdminLoginPage";

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
import LessonEditorPage from "@/pages/teacher/LessonEditorPage";
import QuizzesPage from "@/pages/teacher/QuizzesPage";
import QuizEditorPage from "@/pages/teacher/QuizEditorPage";
import StudentsPage from "@/pages/teacher/StudentsPage";
import StudentDetailPage from "@/pages/teacher/StudentDetailPage";
import TeacherSettingsPage from "@/pages/teacher/TeacherSettingsPage";

import AdminOverviewPage from "@/pages/admin/AdminOverviewPage";
import AdminTeachersPage from "@/pages/admin/AdminTeachersPage";
import AdminLearnersPage from "@/pages/admin/AdminLearnersPage";
import AdminLessonsPage from "@/pages/admin/AdminLessonsPage";
import AdminActivityPage from "@/pages/admin/AdminActivityPage";
import AdminSettingsPage from "@/pages/admin/AdminSettingsPage";

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
      {
        path: "/admin/login",
        element: <AdminLoginPage />,
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
            path: "/teacher/lessons/:categoryId",
            element: <LessonEditorPage />,
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

  // =========================
  // ADMIN ROUTES (ADMIN role only)
  // =========================
  {
    element: <RequireRole allowedRoles={["ADMIN"]} loginPath="/admin/login" />,
    children: [
      {
        element: <AdminPageLayout />,
        children: [
          {
            path: "/admin",
            element: <Navigate to="/admin/overview" replace />,
          },
          {
            path: "/admin/overview",
            element: <AdminOverviewPage />,
          },
          {
            path: "/admin/teachers",
            element: <AdminTeachersPage />,
          },
          {
            path: "/admin/learners",
            element: <AdminLearnersPage />,
          },
          {
            path: "/admin/lessons",
            element: <AdminLessonsPage />,
          },
          {
            path: "/admin/activity",
            element: <AdminActivityPage />,
          },
          {
            path: "/admin/settings",
            element: <AdminSettingsPage />,
          },
        ],
      },
    ],
  },
]);
