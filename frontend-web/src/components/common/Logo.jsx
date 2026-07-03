import React from 'react';
import { Link, useLocation } from 'react-router-dom';

export default function Logo({ className = '', size = 'md', showText = true, stacked = false, to }) {
  const sizes = {
    sm: { img: 'w-10 h-10', text: 'text-[22px] mt-[11px] leading-none' },
    md: { img: 'w-12 h-12', text: 'text-[28px] mt-[14px] leading-none' },
    lg: { img: 'w-24 h-24', text: 'text-[44px] mt-[32px] leading-none' }
  };

  const s = sizes[size] || sizes.md;
  const location = useLocation();
  const linkTo = to || (location.pathname.startsWith('/dashboard') ? '/dashboard' : '/');

  return (
    <Link 
      to={linkTo}
      className={`flex ${stacked ? 'flex-col' : 'flex-row'} items-center gap-4 cursor-pointer hover:opacity-90 active:scale-[0.98] transition-all duration-200 ${className}`}
    >
      {/* Icon Image */}
      <img 
        src="/logo.png" 
        alt="AgendaKu Logo" 
        className={`${s.img} object-contain shrink-0`} 
      />
      {showText && (
        <span className={`font-black ${s.text} tracking-tighter text-[#1E1E1E]`}>
          Agenda<span className="text-[#FACC15]">Ku</span>
        </span>
      )}
    </Link>
  );
}
