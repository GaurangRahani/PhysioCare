import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { SignedIn, SignedOut, RedirectToSignIn } from '@clerk/clerk-react';

import MainLayout from '../components/layout/MainLayout';
import Home from '../features/home/pages/Home';
import Login from '../features/auth/pages/Login';
import Register from '../features/auth/pages/Register';
import ForcePasswordChange from '../features/auth/pages/ForcePasswordChange';
import AuthRedirect from '../features/auth/components/AuthRedirect';

import DashboardLayout from '../features/dashboard/layout/DashboardLayout';
import PatientDashboard from '../features/dashboard/pages/PatientDashboard';
import ExerciseSession from '../features/dashboard/pages/ExerciseSession';

import DoctorLayout from '../features/doctor/layout/DoctorLayout';
import DoctorDashboard from '../features/doctor/pages/DoctorDashboard';
import AvailabilitySettings from '../features/doctor/pages/AvailabilitySettings';
import ExerciseLibrary from '../features/doctor/pages/ExerciseLibrary';

import ReceptionistLayout from '../features/receptionist/layout/ReceptionistLayout';
import ReceptionistDashboard from '../features/receptionist/pages/ReceptionistDashboard';
import AppointmentCalendar from '../features/receptionist/pages/AppointmentCalendar';

import StartConsultation from '../features/doctor/pages/StartConsultation';
import NewConsultation from '../features/doctor/pages/NewConsultation';
import TreatmentPlanBuilder from '../features/doctor/pages/TreatmentPlanBuilder';

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<MainLayout />}>
        <Route index element={<Home />} />
        <Route path="login/*" element={<Login />} />
        <Route path="register/*" element={<Register />} />
      </Route>

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
        <Route path="session" element={<ExerciseSession />} />
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
      </Route>

      {/* We will add /admin routes later in Phase 4 */}
    </Routes>
  );
};

export default AppRoutes;
