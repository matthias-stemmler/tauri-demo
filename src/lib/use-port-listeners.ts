import {
  PortListener,
  refresh,
  subscribeToPortListenersUpdatedEvent,
} from '@/api/api.ts';
import { useEffect, useState } from 'react';

export const usePortListeners = (): PortListener[] => {
  const [portListeners, setPortListeners] = useState<PortListener[]>([]);

  useEffect(() => {
    const unsubscribePromise = (async () => {
      const unsubscribe = await subscribeToPortListenersUpdatedEvent(
        (event) => {
          setPortListeners(event.portListeners);
        },
      );

      await refresh();

      return unsubscribe;
    })();

    return () => {
      unsubscribePromise.then((unsubscribe) => {
        unsubscribe();
      });
    };
  }, []);

  return portListeners;
};
