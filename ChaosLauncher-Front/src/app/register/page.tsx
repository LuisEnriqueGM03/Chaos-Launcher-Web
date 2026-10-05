'use client';

import React from 'react';
import { RegisterForm } from '../../features/auth/presentation/RegisterForm';

export default function RegisterPage() {
  return (
    <div className="flex-1 flex items-center justify-center p-6 relative">
      <div className="absolute inset-0 z-0 opacity-20 pointer-events-none">
        <img
          src="/assets/nether_bg.jpg"
          alt="Nether"
          className="w-full h-full object-cover"
        />
      </div>

      <div className="relative z-10 w-full">
        <RegisterForm />
      </div>
    </div>
  );
}
