'use client';

import React from 'react';
import { ModpackForm } from '../../../../features/modpacks/presentation/ModpackForm';

export default function NewModpackPage() {
  return (
    <div className="max-w-5xl w-full mx-auto px-6 py-8 flex-1">
      <ModpackForm />
    </div>
  );
}
