import React from 'react';

export default function Logo({ className = '', size = 'md', showText = true, stacked = false }) {
  const sizes = {
    sm: { img: 'w-10 h-10', text: 'text-[22px] mt-[11px] leading-none' },
    md: { img: 'w-12 h-12', text: 'text-[28px] mt-[14px] leading-none' },
    lg: { img: 'w-24 h-24', text: 'text-[44px] mt-[32px] leading-none' }
  };

  const s = sizes[size] || sizes.md;

  return (
    <div className={`flex ${stacked ? 'flex-col' : 'flex-row'} items-center gap-4 ${className}`}>
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
    </div>
  );
}
