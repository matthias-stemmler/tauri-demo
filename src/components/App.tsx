import { PortListenersTable } from '@/components/PortListenersTable.tsx';
import { Toaster } from '@/components/ui/sonner.tsx';
import '@/index.css';
import { useOnError } from '@/lib/use-on-error.ts';
import { FC } from 'react';
import { toast } from 'sonner';

export const App: FC = () => {
  useOnError((error) => {
    toast.error(error.message);
  });

  return (
    <div className="p-4">
      <PortListenersTable />
      <Toaster />
    </div>
  );
};
