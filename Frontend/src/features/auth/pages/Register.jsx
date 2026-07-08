import React from 'react';
import { SignUp } from '@clerk/clerk-react';

const Register = () => {
  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-primary/5">
      <div className="w-full max-w-md space-y-8 flex flex-col items-center">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-bold tracking-tight text-heading">
            Create an Account
          </h2>
          <p className="mt-2 text-sm text-body">
            Join PhysioCare and start your recovery journey
          </p>
        </div>
        <SignUp 
          routing="path" 
          path="/register" 
          signInUrl="/login"
          fallbackRedirectUrl="/"
        />
      </div>
    </div>
  );
};

export default Register;
