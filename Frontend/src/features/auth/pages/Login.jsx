import React from 'react';
import { SignIn } from '@clerk/clerk-react';

const Login = () => {
  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-primary/5">
      <div className="w-full max-w-md space-y-8 flex flex-col items-center">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-bold tracking-tight text-heading">
            Welcome back to PhysioCare
          </h2>
          <p className="mt-2 text-sm text-body">
            Log in to your patient portal
          </p>
        </div>
        <SignIn 
          routing="path" 
          path="/login" 
          signUpUrl="/register"
          fallbackRedirectUrl="/"
        />
      </div>
    </div>
  );
};

export default Login;
