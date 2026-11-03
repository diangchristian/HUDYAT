import * as accountService from "../services/account.service.js";
import * as adminContentService from "../services/admin-content.service.js";
import * as auditService from "../services/audit.service.js";
import { serviceEndpoint } from "../utils/serviceEndpoint.js";

export const getOverview = serviceEndpoint(
  () => adminContentService.getOverview(),
  "Unable to load the overview.",
);

export const listLessons = serviceEndpoint(
  () => adminContentService.listLessons(),
  "Unable to load lessons.",
);

export const updateLesson = serviceEndpoint(
  (req) =>
    adminContentService.updateLesson(
      req.user!.id,
      req.params.lessonId as string,
      req.body,
    ),
  "Unable to update this lesson.",
);

export const listTeachers = serviceEndpoint(
  () => accountService.listTeachers(),
  "Unable to load teachers.",
);

export const createTeacher = serviceEndpoint(
  (req) => accountService.createTeacher(req.user!.id, req.body),
  "Unable to create this teacher.",
);

export const updateTeacher = serviceEndpoint(
  (req) =>
    accountService.updateTeacher(
      req.user!.id,
      req.params.teacherId as string,
      req.body,
    ),
  "Unable to update this teacher.",
);

export const resetTeacherPassword = serviceEndpoint(
  (req) =>
    accountService.resetTeacherPassword(
      req.user!.id,
      req.params.teacherId as string,
    ),
  "Unable to reset this teacher's password.",
);

export const setTeacherStatus = serviceEndpoint(
  (req) =>
    accountService.setAccountStatus(
      req.user!.id,
      "TEACHER",
      req.params.teacherId as string,
      req.body,
    ),
  "Unable to update this teacher.",
);

export const listLearners = serviceEndpoint(
  () => accountService.listLearnerAccounts(),
  "Unable to load learners.",
);

export const setLearnerStatus = serviceEndpoint(
  (req) =>
    accountService.setAccountStatus(
      req.user!.id,
      "LEARNER",
      req.params.learnerId as string,
      req.body,
    ),
  "Unable to update this learner.",
);

export const listActivity = serviceEndpoint(
  (req) => auditService.listActivity(req.query),
  "Unable to load the activity log.",
);
