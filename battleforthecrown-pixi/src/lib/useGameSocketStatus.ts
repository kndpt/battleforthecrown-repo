import { useEffect, useState } from 'react';
import { gameSocket, type ConnectionStatus } from '@/api/ws';

export function useGameSocketStatus(): ConnectionStatus {
  const [status, setStatus] = useState<ConnectionStatus>(() => gameSocket.getStatus());
  useEffect(() => {
    return gameSocket.subscribeStatus(setStatus);
  }, []);
  return status;
}
