import React from 'react';

interface StoreProviderProps {
  children: React.ReactNode;
}

export function StoreProvider({children}: StoreProviderProps) {
  return <>{children}</>;
}
