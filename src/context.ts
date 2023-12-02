import * as React from 'react';
import { ContextType } from './type';

export const AppContext = React.createContext<ContextType | undefined>(
  undefined
);
