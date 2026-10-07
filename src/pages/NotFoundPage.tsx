import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/common/Button';

export default function NotFoundPage() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-center px-6 bg-white dark:bg-zinc-950">
      <p className="text-6xl font-black text-zinc-200 dark:text-zinc-800 mb-4">404</p>
      <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 mb-2">Page not found</h1>
      <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-6">
        The page you're looking for doesn't exist.
      </p>
      <Button variant="primary" size="sm" onClick={() => navigate('/')}>
        Back to dashboard
      </Button>
    </div>
  );
}
