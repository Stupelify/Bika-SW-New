import CustomerDetailClient from './client';

export function generateStaticParams() {
  // Static export needs at least one param; real IDs are resolved client-side
  // at runtime (the bundled app navigates via the SPA router, not file loads).
  return [{ id: 'placeholder' }];
}

export default function CustomerDetailPage() {
  return <CustomerDetailClient />;
}
