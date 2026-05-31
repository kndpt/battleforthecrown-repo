import { createContext, useContext, useEffect } from 'react';

type HeaderResource = 'iron' | 'stone' | 'wood';
export type HeaderResourceClickHandler = ((resource: HeaderResource) => void) | null;

export const GameShellHeaderContext = createContext<{
  setResourceClickHandler: (handler: HeaderResourceClickHandler) => void;
} | null>(null);

export function useGameShellResourceClick(handler: HeaderResourceClickHandler) {
  const context = useContext(GameShellHeaderContext);

  useEffect(() => {
    if (!context) return undefined;
    context.setResourceClickHandler(handler);
    return () => context.setResourceClickHandler(null);
  }, [context, handler]);
}
