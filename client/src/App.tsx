import { Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ToastProvider } from './components/Toast';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import LoginPage from './pages/LoginPage';

import AssignmentsPage from './pages/AssignmentsPage';
import GradeJournalsListPage from './pages/GradeJournalsListPage';
import AttendanceJournalsListPage from './pages/AttendanceJournalsListPage';
import JournalGradePage from './pages/JournalGradePage';
import JournalAttendancePage from './pages/JournalAttendancePage';
import AdminPage from './pages/AdminPage';
import StudentGradesPage from './pages/StudentGradesPage';
import StudentAttendancePage from './pages/StudentAttendancePage';
import TeacherDisciplinesPage from './pages/TeacherDisciplinesPage';
import TeacherGroupsPage from './pages/TeacherGroupsPage';
import DeanDashboardPage from './pages/DeanDashboardPage';
import GroupDisciplinesPage from './pages/GroupDisciplinesPage';
import MaintenanceGuard from './components/MaintenanceGuard';
import { useAuth } from './contexts/AuthContext';
import { Navigate } from 'react-router-dom';

function HomeRedirect() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  const map: Record<string, string> = {
    admin: '/admin',
    deanery: '/dean/dashboard',
    teacher: '/my-disciplines',
    student: '/grades',
  };
  return <Navigate to={map[user.role] || '/'} replace />;
}

function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route
            path="/*"
            element={
              <MaintenanceGuard>
                <ProtectedRoute>
                  <Layout>
                    <Routes>
                      <Route path="/" element={<HomeRedirect />} />
                      <Route path="/grade-journals" element={<GradeJournalsListPage />} />
                      <Route path="/grade-journals/:id" element={<JournalGradePage />} />
                      <Route path="/attendance-journals" element={<AttendanceJournalsListPage />} />
                      <Route path="/attendance-journals/:id" element={<JournalAttendancePage />} />
                      <Route path="/my-disciplines" element={<TeacherDisciplinesPage />} />
                      <Route path="/my-disciplines/:disciplineId/groups" element={<TeacherGroupsPage />} />
                      <Route path="/grades" element={<StudentGradesPage />} />
                      <Route path="/attendance" element={<StudentAttendancePage />} />
                      <Route
                        path="/assignments"
                        element={
                          <ProtectedRoute roles={['admin']}>
                            <AssignmentsPage />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/admin"
                        element={
                          <ProtectedRoute roles={['admin']}>
                            <AdminPage />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/dean/dashboard"
                        element={
                          <ProtectedRoute roles={['admin', 'deanery']}>
                            <DeanDashboardPage />
                          </ProtectedRoute>
                        }
                      />
                      <Route path="/groups/:groupId/disciplines" element={<GroupDisciplinesPage />} />
                    </Routes>
                  </Layout>
                </ProtectedRoute>
              </MaintenanceGuard>
            }
          />
        </Routes>
      </ToastProvider>
    </AuthProvider>
  );
}

export default App;
