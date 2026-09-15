import React from 'react';
import { Link } from 'react-router-dom';

const LOGO_URL = 'https://bizweb.dktcdn.net/100/576/749/themes/1058890/assets/logo.png?1789455607211';

interface SiteLogoProps {
  /** Tailwind height class for the logo image */
  heightClass?: string;
  /** true = render a white tile behind the logo (for dark/red backgrounds) */
  onDark?: boolean;
  /** render as a clickable link to the homepage (default) */
  clickable?: boolean;
  /** show the text block next to the logo */
  showText?: boolean;
  /** text color variant for the wordmark block */
  textVariant?: 'red' | 'white';
  className?: string;
  onClick?: () => void;
}

export const SiteLogo: React.FC<SiteLogoProps> = ({
  heightClass = 'h-10',
  onDark = false,
  clickable = true,
  showText = false,
  textVariant = 'red',
  className = '',
  onClick
}) => {
  const image = (
    <img
      src={LOGO_URL}
      alt="Logo NXB Kim Đồng"
      className={`object-contain group-hover:scale-105 transition-transform duration-200 ${heightClass} w-auto`}
    />
  );

  const tile = onDark ? (
    <div className={`bg-white rounded-lg p-1 flex items-center justify-center ${heightClass}`}>
      <img src={LOGO_URL} alt="Logo NXB Kim Đồng" className="h-full w-auto object-contain group-hover:scale-105 transition-transform duration-200" />
    </div>
  ) : (
    image
  );

  const wordmark = showText && (
    <div className="text-left leading-tight">
      <span className={`block text-lg font-black tracking-tight ${textVariant === 'red' ? 'text-kimdong-red' : 'text-white'}`}>
        KIM ĐỒNG
      </span>
      <span className={`block text-[10px] font-semibold uppercase tracking-widest ${textVariant === 'red' ? 'text-gray-500' : 'text-white/70'}`}>
        Nhà Xuất Bản
      </span>
    </div>
  );

  if (!clickable) {
    return (
      <span className={`inline-flex items-center gap-2.5 group ${className}`}>
        {tile}
        {wordmark}
      </span>
    );
  }

  // Clicking the logo while already on the homepage should re-fetch it
  // (a plain Link to "/" would be a no-op there), everywhere else it navigates home.
  const handleClick = (e: React.MouseEvent) => {
    onClick?.();
    if (window.location.pathname === '/') {
      e.preventDefault();
      window.location.reload();
    }
  };

  return (
    <Link to="/" title="Về trang chủ" onClick={handleClick} className={`inline-flex items-center gap-2.5 group ${className}`}>
      {tile}
      {wordmark}
    </Link>
  );
};
