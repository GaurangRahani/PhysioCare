import React from 'react';
import { Activity } from 'lucide-react';

/**
 * AlignCare Unified Brand Logo Component
 * Ensures 100% visual and geometric consistency across public, auth, and all 4 dashboard portals.
 */
const Logo = ({ 
  size = 'md', // 'sm' | 'md' | 'lg'
  theme = 'auto', // 'light' | 'dark' | 'auto'
  subtitle = '',
  collapsed = false,
  className = '',
  showSubtitle = true
}) => {
  const boxSizes = {
    sm: 'w-7 h-7 rounded-lg',
    md: 'w-8 h-8 rounded-lg',
    lg: 'w-9 h-9 rounded-xl',
  };

  const iconSizes = {
    sm: 15,
    md: 17,
    lg: 20,
  };

  const textSizes = {
    sm: 'text-[14px]',
    md: 'text-[16px] sm:text-[18px]',
    lg: 'text-[20px] sm:text-[22px]',
  };

  const isDark = theme === 'dark';

  return (
    <div className={`flex items-center gap-2.5 select-none ${className}`}>
      {/* Signature AlignCare Emerald Brand Mark Container */}
      <div 
        className={`${boxSizes[size] || boxSizes.md} bg-[#008060] flex items-center justify-center text-[#FFFFFF] shrink-0 shadow-xs transition-transform`}
      >
        <Activity 
          size={iconSizes[size] || iconSizes.md} 
          className="text-[#FFFFFF]" 
          strokeWidth={2.6} 
        />
      </div>

      {/* Brand Name Typography & Subtitle */}
      {!collapsed && (
        <div className="flex flex-col leading-none">
          <span 
            className={`${textSizes[size] || textSizes.md} font-bold tracking-tight ${
              isDark ? 'text-[#FFFFFF]' : 'text-[#111111]'
            }`}
          >
            AlignCare
          </span>
          {showSubtitle && subtitle && (
            <span 
              className={`text-[10px] tracking-wider mt-0.5 font-medium ${
                isDark ? 'text-[#8A8A8A]' : 'text-[#616161]'
              }`}
            >
              {subtitle}
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default Logo;
