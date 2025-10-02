import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";

import NewPassword from "./components/NewPassword";
import PrivateRoute from "./components/PrivateRoute";
import TeacherDashboard from "./components/TeacherDashboard.tsx";
import { AdvisorInfoProvider } from "./context/AdvisorInfoContext";
import { StudentInfoProvider } from "./context/StudentInfoContext";
import AdminDashboard from "./pages/admin/AdminDashboard.tsx";
import AdvisorInfor from "./pages/admin/AdvisorInfo";
import ClassDetail from "./pages/admin/ClassDetail";
import ClassManagement from "./pages/admin/ClassManagement";
import DepartmentDetail from "./pages/admin/DepartmentDetail";
import DepartmentManagement from "./pages/admin/DepartmentManagement";
import TeacherDetailInDepartment from "./pages/admin/TeacherDetailInDepartment";
import ClassManagementForSubjectTeacher from "./pages/advisor/ClassManagementForSubjectTeacher";
import Dashboard from "./pages/advisor/Dashboard";
import SubjectTeacherScoreDetail from "./pages/advisor/SubjectTeacherScoreDetail";
import TeacherSchedule from "./pages/advisor/TeacherSchedule.tsx";
import ChangePassword from "./pages/ChangePassword";
import DatabaseManagement from "./pages/DatabaseManagement";
import Forum from "./pages/Forum";
import Home from "./pages/Home";
import Layout from "./pages/Layout";
import Login from "./pages/Login";
import NoPage from "./pages/NoPage";
import Profile from "./pages/Profile";
import ResetPassword from "./pages/ResetPassword";
import Schedule from "./pages/Schedule";
import PersonalScore from "./pages/student/PersonalScore";
import StudentSchedule from "./pages/student/StudentSchedule.tsx";
import StudentInfor from "./pages/StudentInfor";
import StudentScoreDetail from "./pages/StudentScoreDetail";
import StudentScoresList from "./pages/StudentScoresList";
import Unauthorized from "./pages/Unauthorized";

const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/changePassword" element={<ChangePassword />} />
        <Route path="/resetPassword" element={<ResetPassword />} />
        <Route path="/unauthorized" element={<Unauthorized />} />
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/new-password/:userId" element={<NewPassword />} />
        <Route path="*" element={<NoPage />} />

        {/* ADMIN ROUTES */}
        <Route
          path="/admin"
          element={
            <PrivateRoute allowedRoles={["admin"]}>
              <Layout />
            </PrivateRoute>
          }
        >
          <Route index element={<Home />} />
          {/* <Route path="forum" element={<Forum />} /> */}
          <Route path="class" element={<ClassManagement />} />
          <Route path="class/:classId" element={<ClassDetail />} />
          <Route path="profile" element={<Profile />} />
          <Route path="admindashboard" element={<AdminDashboard />} />
          <Route path="schedule" element={<Schedule />} />
          <Route path="*" element={<NoPage />} />
          <Route path="studentScore" element={<StudentScoresList />} />
          <Route
            path="studentDetail/:studentId"
            element={<StudentScoreDetail />}
          />
          <Route path="department" element={<DepartmentManagement />} />
          <Route
            path="department/:departmentId"
            element={<DepartmentDetail />}
          />
          <Route
            path="department/:departmentId/:teacherId"
            element={<TeacherDetailInDepartment />}
          />
          <Route
            path="students"
            element={
              <StudentInfoProvider>
                <StudentInfor />
              </StudentInfoProvider>
            }
          />
          <Route path="databaseManagement" element={<DatabaseManagement />} />
          <Route
            path="advisorInfo"
            element={
              <AdvisorInfoProvider>
                <AdvisorInfor />
              </AdvisorInfoProvider>
            }
          />
        </Route>

        {/* ADVISOR ROUTES */}
        <Route
          path="/advisor"
          element={
            <PrivateRoute allowedRoles={["advisor"]}>
              <Layout />
            </PrivateRoute>
          }
        >
          <Route index element={<Home />} />
          <Route path="forum" element={<Forum />} />
          <Route path="profile" element={<Profile />} />
          <Route path="schedule" element={<TeacherSchedule />} />
          <Route path="dashboard" element={<Dashboard />} />

          <Route path="teacherdashboard" element={<TeacherDashboard />} />
          {/* <Route path="dashboard" element={<Dashboard />} /> */}
          <Route
            path="classForSubjectTeacher"
            element={<ClassManagementForSubjectTeacher />}
          />
          <Route
            path="students"
            element={
              <StudentInfoProvider>
                <StudentInfor />
              </StudentInfoProvider>
            }
          />
          <Route
            path="classForSubjectTeacher"
            element={<ClassManagementForSubjectTeacher />}
          />
          <Route
            path="classForSubjectTeacher/:classId/:studentId"
            element={<SubjectTeacherScoreDetail />}
          />
          <Route path="databaseManagement" element={<DatabaseManagement />} />
          {/* <Route path="dashboard" element={<DepartmentManagement />} /> */}
          <Route path="studentScore" element={<StudentScoresList />} />
          <Route
            path="studentDetail/:studentId"
            element={<StudentScoreDetail />}
          />
          <Route path="*" element={<NoPage />} />
        </Route>

        {/* STUDENT ROUTES */}
        <Route
          path="/student"
          element={
            <PrivateRoute allowedRoles={["student"]}>
              <Layout />
            </PrivateRoute>
          }
        >
          <Route index element={<Home />} />
          <Route path="forum" element={<Forum />} />
          <Route path="profile" element={<Profile />} />
          {/* <Route path="schedule" element={<Schedule />} /> */}
          <Route path="personalScore" element={<PersonalScore />} />
          <Route path="studentSchedule" element={<StudentSchedule />} />
          <Route path="*" element={<NoPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
};

export default App;
