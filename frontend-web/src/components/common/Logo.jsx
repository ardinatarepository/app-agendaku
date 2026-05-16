import React from 'react';

export default function Logo({ className = '', size = 'md', showText = true, stacked = false }) {
  const sizes = {
    sm: { img: 'w-10 h-10', text: 'text-xl' },
    md: { img: 'w-12 h-12', text: 'text-2xl' },
    lg: { img: 'w-24 h-24', text: 'text-3xl' }
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
      
      {/* Text */}
      {showText && (
        <span className={`${s.text} font-black text-[#1E1E1E] tracking-tight`}>
          AgendaKu
        </span>
      )}
    </div>
  );
}
