import { PortListener, killProcess } from '@/api/api.ts';
import { Badge } from '@/components/ui/badge.tsx';
import { Button } from '@/components/ui/button.tsx';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog.tsx';
import { usePortListeners } from '@/lib/use-port-listeners.ts';
import { cn } from '@/lib/utils.ts';
import { Loader, X } from 'lucide-react';
import { FC, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { toast } from 'sonner';

export const PortListenersTable: FC = () => {
  const portListeners = usePortListeners();
  const [isFlashing, setIsFlashing] = useState<boolean | undefined>(undefined);

  useEffect(() => {
    if (portListeners.length > 0) {
      setIsFlashing((f) => f !== undefined);
    }
  }, [portListeners]);

  return portListeners.length === 0 ? (
    <Loader className="animate-spin" />
  ) : (
    <>
      {createPortal(
        <div
          className={cn(
            'fixed top-0 left-0 -z-50 h-screen w-screen transition-[background-color] duration-300',
            isFlashing && 'bg-blue-200',
          )}
          onTransitionEnd={() => {
            setIsFlashing(false);
          }}
        />,
        document.body,
      )}

      <table className="text-left">
        <thead>
          <tr>
            <th className="min-w-24 pr-8">Port</th>
            <th className="min-w-56 pr-8">Process name</th>
            <th className="min-w-24 pr-8">Process ID</th>
            <th className="min-w-24 pr-8">Kill</th>
          </tr>
        </thead>

        <tbody className="font-mono">
          {portListeners.map((portListener) => (
            <PortListenerRow
              key={`${portListener.port}-${portListener.processId}`}
              {...portListener}
            />
          ))}
        </tbody>
      </table>
    </>
  );
};

const PortListenerRow: FC<PortListener> = ({
  port,
  processId,
  processName,
}) => (
  <tr>
    <td className="pr-8">
      <Badge>{port}</Badge>
    </td>

    <td className="pr-8">{processName}</td>
    <td className="pr-8">{processId}</td>

    <td className="pr-8">
      <Dialog>
        <DialogTrigger asChild>
          <Button className="size-6 p-0" variant="destructive">
            <X className="size-4" />
          </Button>
        </DialogTrigger>

        <DialogContent aria-describedby={undefined}>
          <DialogTitle>Kill process</DialogTitle>

          <div>
            Do you really want to kill process #{processId}: {processName}?
          </div>

          <DialogFooter>
            <DialogClose asChild>
              <Button
                className="min-w-28"
                variant="destructive"
                onClick={async () => {
                  try {
                    await killProcess({ processId });

                    toast.success(
                      `Killed process #${processId}: ${processName}`,
                    );
                  } catch (err) {
                    toast.error(
                      `Failed to kill process #${processId}: ${processName}`,
                    );
                  }
                }}
              >
                Kill
              </Button>
            </DialogClose>

            <DialogClose asChild>
              <Button className="min-w-28" variant="secondary">
                Cancel
              </Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </td>
  </tr>
);
