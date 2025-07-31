import { DollarOutlined, GithubOutlined, TeamOutlined, UserAddOutlined, YoutubeOutlined } from '@ant-design/icons';
import { Space } from 'antd';
import React from 'react';
import { ConfigProvider } from '../ConfigProvider';
import './index.less';
import { getI18n } from '../../i18n';

interface TopBannerProps {
  locale: string;
}

export const TopBanner: React.FC<TopBannerProps> = ({ locale }) => {
  const i18n = getI18n(locale);
  const iconLinks = [
    {
      icon: <GithubOutlined />,
      href: i18n.TOPBANNER_BUGS_FEATURES_HREF,
      text: i18n.TOPBANNER_BUGS_FEATURES,
    },
    {
      icon: <YoutubeOutlined />,
      href: i18n.TOPBANNER_VIDEO_HREF,
      text: i18n.TOPBANNER_VIDEO,
    },
    {
      icon: <TeamOutlined />,
      href: i18n.TOPBANNER_CONTACT_HREF,
      text: i18n.TOPBANNER_CONTACT,
    },
    {
      icon: <UserAddOutlined />,
      href: i18n.TOPBANNER_SOCIAL_HREF,
      text: i18n.TOPBANNER_SOCIAL,
    },
  ];

  return (
    <ConfigProvider>
      <div className="m-top-banner">
        <div className="banner-content">
          <div className="pro-link">
            <a href={i18n.TOPBANNER_LIFEOS_PRO_HREF} target="_blank" rel="noopener noreferrer">
              <Space align="center">
                <DollarOutlined />
                <span>{i18n.TOPBANNER_LIFEOS_PRO}</span>
              </Space>
            </a>
          </div>
          <div className="deepask-ad">
            <a href={i18n.TOP_BANNER_DEEPASK_HREF} target="_blank" rel="noopener noreferrer">
              <Space align="center">
                🔥
                <span>{i18n.TOP_BANNER_DEEPASK_AD}</span>
                🤖
              </Space>
            </a>
          </div>
        </div>
        <div className="icon-links">
          <Space align="center" size="large">
            {iconLinks.map(({ icon, href, text }) => (
              <a key={href} href={href} target="_blank" rel="noopener noreferrer" aria-label={text}>
                <Space align="center">
                  {icon}
                  <span>{text}</span>
                </Space>
              </a>
            ))}
          </Space>
        </div>
      </div>
    </ConfigProvider>
  );
};
