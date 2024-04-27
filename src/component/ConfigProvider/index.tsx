import React, { ReactNode, useEffect, useState } from 'react';
import reduceCSSCalc from 'reduce-css-calc';

import { useApp } from '../../hooks/useApp';
import { isDarkTheme } from '../../util';

import { ConfigProvider as AntdConfigProvider, ThemeConfig, theme } from 'antd';

export const ConfigProvider = (props: {
  children: ReactNode;
  components?: ThemeConfig['components'];
}) => {
  const { children, components } = props;
  const { locale } = useApp() || {};
  const computedStyle = getComputedStyle(
    document.querySelector('.app-container')!
  );
  const fontSize =
    parseInt(computedStyle?.getPropertyValue('--nav-item-size')) || 13;
  const [isDark, setDark] = useState(isDarkTheme());
  useEffect(() => {
    const handleBodyClassChange = () => {
      setDark(isDarkTheme());
    };

    const observer = new MutationObserver(handleBodyClassChange);
    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ['class'],
    });

    return () => {
      observer.disconnect();
    };
  }, []);
  return (
    <AntdConfigProvider
      locale={locale}
      theme={{
        token: {
          fontSize,
          colorPrimary: reduceCSSCalc(
            getComputedStyle(document.body).getPropertyValue(
              '--interactive-accent'
            )
          ),
        },
        components: {
          ...components,
        },
        algorithm: isDark ? theme.darkAlgorithm : theme.defaultAlgorithm,
      }}
    >
      {children}
    </AntdConfigProvider>
  );
};
