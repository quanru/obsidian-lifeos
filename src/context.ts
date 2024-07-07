import React from 'react';
import type { ContextType } from './type';

export const AppContext = React.createContext<ContextType | undefined>(
  undefined,
);
