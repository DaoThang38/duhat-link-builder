'use client';

import React from 'react';
import LinkBuilderForm from '@/components/LinkBuilderForm';
import { useUser } from '@/context/UserContext';

export default function DashboardPage() {
  const { user } = useUser();

  if (!user) return null;

  return (
    <div className="space-y-6">
      {/* Link Builder Form Only */}
      <section>
        <LinkBuilderForm currentUser={user} />
      </section>
    </div>
  );
}
