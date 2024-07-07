import React from 'react';

export const useDocumentEvent = (
  eventName: string,
  handler: (event: CustomEvent) => void,
) => {
  React.useEffect(() => {
    document.addEventListener(eventName, handler);

    return () => {
      document.removeEventListener(eventName, handler);
    };
  }, [eventName, handler]);
};
