import * as React from 'react';
import { App } from 'obsidian';
import { AppContext } from '../context';

export const useApp = (): App | undefined => {
  return React.useContext(AppContext);
};
