import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { SignedIn, SignedOut, RedirectToSignIn } from '@clerk/clerk-react';

import MainLayout from '../components/layout/MainLayout';
import Home from '../features/home/pages/Home';
import Login from '../features/auth/pages/Login';
import Register from '../features/auth/pages/Register';
import ForcePasswordChange from '../features/auth/pages/ForcePasswordChange';
import AuthRedirect from '../features/auth/components/AuthRedirect';

import DashboardLayout from '../features/dashboard/layout/DashboardLayout';
import PatientDashboard from '../features/dashboard/pages/PatientDashboard';
import ProgressPage from '../features/dashboard/pages/ProgressPage.jsx';
import AppointmentsPage from '../features/dashboard/pages/AppointmentsPage.jsx';
import ExerciseSessionPage from '../features/dashboard/pages/ExerciseSessionPage';
import SessionCompletePage from '../features/dashboard/pages/SessionCompletePage';
import ProfilePage from '../features/dashboard/pages/ProfilePage.jsx';

import DoctorLayout from '../features/doctor/layout/DoctorLayout';
import DoctorDashboard from '../features/doctor/pages/DoctorDashboard';
import AvailabilitySettings from '../features/doctor/pages/AvailabilitySettings';
import ExerciseLibrary from '../features/doctor/pages/ExerciseLibrary';
import PatientsTab from '../features/doctor/pages/PatientsTab';

import ReceptionistLayout from '../features/receptionist/layout/ReceptionistLayout';
import ReceptionistDashboard from '../features/receptionist/pages/ReceptionistDashboard';
import AppointmentCalendar from '../features/receptionist/pages/AppointmentCalendar';
import ReceptionistPatients from '../features/receptionist/pages/ReceptionistPatients';

import StartConsultation from '../features/doctor/pages/StartConsultation';
import NewConsultation from '../features/doctor/pages/NewConsultation';
import TreatmentPlanBuilder from '../features/doctor/pages/TreatmentPlanBuilder';

// ── Admin ──────────────────────────────────────────────────────────────────
import AdminLayout from '../features/admin/layout/AdminLayout';
import AdminDashboard from '../features/admin/pages/AdminDashboard';
import AdminUsers from '../features/admin/pages/AdminUsers';
import AdminSettings from '../features/admin/pages/AdminSettings';

const AppRoutes = () => {
  return (
    <Routes>
      {/* Public Pages with Header/Footer */}
      <Route path="/" element={<MainLayout />}>
        <Route index element={<Home />} />
      </Route>

      {/* Auth Pages without Header/Footer */}
      <Route path="/login/*" element={<Login />} />
      <Route path="/register/*" element={<Register />} />

      {/* Redirect /book to /dashboard so patients can book appointments */}
      <Route path="/book" element={<Navigate to="/dashboard" replace />} />

      {/* Force Password Change route (must be signed in) */}
      <Route 
        path="/force-password-change" 
        element={
          <SignedIn>
            <ForcePasswordChange />
          </SignedIn>
        } 
      />

      {/* Protected Dashboard Routes */}
      <Route 
        path="/dashboard" 
        element={
          <>
            <SignedIn>
              <AuthRedirect>
                <DashboardLayout />
              </AuthRedirect>
            </SignedIn>
            <SignedOut>
              <RedirectToSignIn />
            </SignedOut>
          </>
        }
      >
        <Route index element={<PatientDashboard />} />
        <Route path="appointments" element={<AppointmentsPage />} />
        <Route path="progress" element={<ProgressPage />} />
        <Route path="profile" element={<ProfilePage />} />
        <Route path="session/:planId/:sessionNumber" element={<ExerciseSessionPage />} />
        <Route path="session/:planId/:sessionNumber/complete" element={<SessionCompletePage />} />
      </Route>

      {/* Doctor Dashboard Routes */}
      <Route 
        path="/doctor-dashboard" 
        element={
          <>
            <SignedIn>
              <AuthRedirect>
                <DoctorLayout />
              </AuthRedirect>
            </SignedIn>
            <SignedOut>
              <RedirectToSignIn />
            </SignedOut>
          </>
        }
      >
        <Route index element={<DoctorDashboard />} />
        <Route path="availability" element={<AvailabilitySettings />} />
        <Route path="exercise-library" element={<ExerciseLibrary />} />
        <Route path="patients" element={<PatientsTab />} />
        <Route path="patients/:patientId" element={<StartConsultation />} />
        <Route path="consultation/:appointmentId" element={<StartConsultation />} />
        <Route path="consultation/:appointmentId/new" element={<NewConsultation />} />
        <Route path="consultation/:appointmentId/plan" element={<TreatmentPlanBuilder />} />
      </Route>

      {/* Receptionist Dashboard Routes */}
      <Route 
        path="/receptionist-dashboard" 
        element={
          <>
            <SignedIn>
              <AuthRedirect>
                <ReceptionistLayout />
              </AuthRedirect>
            </SignedIn>
            <SignedOut>
              <RedirectToSignIn />
            </SignedOut>
          </>
        }
      >
        <Route index element={<ReceptionistDashboard />} />
        <Route path="calendar" element={<AppointmentCalendar />} />
        <Route path="patients" element={<ReceptionistPatients />} />
      </Route>

      {/* ── Admin Dashboard Routes ──────────────────────────────────── */}
      <Route
        path="/admin"
        element={
          <>
            <SignedIn>
              <AdminLayout />
            </SignedIn>
            <SignedOut>
              <RedirectToSignIn />
            </SignedOut>
          </>
        }
      >
        <Route index element={<Navigate to="/admin/dashboard" replace />} />
        <Route path="dashboard" element={<AdminDashboard />} />
        <Route path="users"     element={<AdminUsers />} />
        <Route path="settings"  element={<AdminSettings />} />
      </Route>
    </Routes>
  );
};

export default AppRoutes;
