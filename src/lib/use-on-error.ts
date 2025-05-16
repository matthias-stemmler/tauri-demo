import { ErrorEvent, subscribeToErrorEvent } from '@/api/api';
import { useEffect } from 'react';

export const useOnError = (handler: (event: ErrorEvent) => void) => {
  useEffect(() => {
    const unsubscribePromise = subscribeToErrorEvent(handler);

    return () => {
      unsubscribePromise.then((unsubscribe) => unsubscribe());
    };
  });
};
