'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AuditLogsPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/dashboard/settings?section=logs');
  }, [router]);

  return (
    <div className="card py-12 text-center">
      <p className="text-sm text-[var(--text-2)]">Redirecting to activity logs...</p>
    </div>
  );
}
