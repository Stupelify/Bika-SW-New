import { Clock3 } from 'lucide-react';

interface ComingSoonPageProps {
  title: string;
  description: string;
}

export default function ComingSoonPage({
  title,
  description,
}: ComingSoonPageProps) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
        <p className="text-gray-600 mt-1">{description}</p>
      </div>

      <div className="card py-12 text-center">
        <div className="w-14 h-14 mx-auto rounded-full bg-primary-50 text-primary-600 flex items-center justify-center mb-4">
          <Clock3 className="w-7 h-7" />
        </div>
        <h2 className="text-lg font-semibold text-gray-900 mb-2">
          This section is under construction
        </h2>
        <p className="text-sm text-gray-600 max-w-lg mx-auto">
          Navigation is now wired correctly. This page can be extended with full
          business workflows next.
        </p>
      </div>
    </div>
  );
}
