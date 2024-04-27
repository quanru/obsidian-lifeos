import React from 'react';
import { AppContext } from '../context';
import type { ContextType } from '../type';

export const useApp = (): ContextType | undefined => {
  return React.useContext(AppContext);
};
