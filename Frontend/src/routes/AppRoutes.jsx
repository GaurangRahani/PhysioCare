import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { SignedIn, SignedOut, RedirectToSignIn } from '@clerk/clerk-react';

import MainLayout from '../components/layout/MainLayout';
import Home from '../features/home/pages/Home';
import Login from '../features/auth/pages/Login';
import Register from '../features/auth/pages/Register';

import DashboardLayout from '../features/dashboard/layout/DashboardLayout';
import PatientDashboard from '../features/dashboard/pages/PatientDashboard';

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<MainLayout />}>
        <Route index element={<Home />} />
        <Route path="login/*" element={<Login />} />
        <Route path="register/*" element={<Register />} />
      </Route>

      {/* Protected Dashboard Routes */}
      <Route 
        path="/dashboard" 
        element={
          <>
            <SignedIn>
              <DashboardLayout />
            </SignedIn>
            <SignedOut>
              <RedirectToSignIn />
            </SignedOut>
          </>
        }
      >
        <Route index element={<PatientDashboard />} />
      </Route>
    </Routes>
  );
};

export default AppRoutes;
