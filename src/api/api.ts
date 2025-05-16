import { invoke } from '@tauri-apps/api/core';
import { UnlistenFn, listen } from '@tauri-apps/api/event';

export type PortListenersUpdatedEvent = {
  portListeners: PortListener[];
};

export type PortListener = {
  port: number;
  processId: number;
  processName: string;
};

export type ErrorEvent = {
  message: string;
};

export const refresh = (): Promise<void> => invoke('refresh');

export const killProcess = (params: { processId: number }): Promise<void> =>
  invoke('kill_process', params);

export const subscribeToPortListenersUpdatedEvent = async (
  handler: (event: PortListenersUpdatedEvent) => void,
): Promise<UnlistenFn> =>
  listen<PortListenersUpdatedEvent>('port_listeners_updated', (event) =>
    handler(event.payload),
  );

export const subscribeToErrorEvent = async (
  handler: (event: ErrorEvent) => void,
): Promise<UnlistenFn> =>
  listen<ErrorEvent>('error', (event) => handler(event.payload));
