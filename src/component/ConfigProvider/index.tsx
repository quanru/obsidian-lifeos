import React, { type ReactNode, useEffect, useState } from 'react';
import reduceCSSCalc from 'reduce-css-calc';

import { useApp } from '../../hooks/useApp';
import { getAntdLocale, getLocale } from '../../i18n';
import { isDarkTheme } from '../../util';

import { ConfigProvider as AntdConfigProvider, type ThemeConfig, theme } from 'antd';

export const ConfigProvider = (props: {
  children: ReactNode;
  components?: ThemeConfig['components'];
  localeKey?: string;
}) => {
  const { children, components, localeKey } = props;
  const { locale, settings } = useApp() || {};
  const computedStyle = getComputedStyle(document.querySelector('.app-container')!);
  const fontSize = Number.parseInt(computedStyle?.getPropertyValue('--nav-item-size')) || 13;
  const [isDark, setDark] = useState(isDarkTheme());
  const effectiveLocale = getAntdLocale(localeKey || settings?.locale || locale?.locale || getLocale());

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
      locale={effectiveLocale}
      theme={{
        token: {
          fontFamily: 'var(--font-interface)',
          fontSize,
          colorPrimary: reduceCSSCalc(getComputedStyle(document.body).getPropertyValue('--interactive-accent')),
          colorBgContainer: reduceCSSCalc(
            getComputedStyle(document.body).getPropertyValue('--background-secondary-alt'),
          ),
          colorLink: reduceCSSCalc(getComputedStyle(document.body).getPropertyValue('--interactive-accent')),
        },
        components: {
          ...components,
          Tag: {
            defaultBg: reduceCSSCalc(getComputedStyle(document.body).getPropertyValue('--tag-background')),
            defaultColor: reduceCSSCalc(getComputedStyle(document.body).getPropertyValue('--tag-color')),
          },
        },
        algorithm: isDark ? theme.darkAlgorithm : theme.defaultAlgorithm,
      }}
    >
      {children}
    </AntdConfigProvider>
  );
};
