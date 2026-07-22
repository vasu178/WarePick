import React, { useState, useRef, useEffect } from 'react';

export default function GlassSelect({ value, onChange, options, placeholder = "Select an option", className = "" }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedOption = options.find(opt => opt.value === value);

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full bg-surface-container/30 backdrop-blur-md border border-white/10 shadow-inner rounded-lg text-on-surface text-body-md font-body-md px-3 py-2 flex items-center justify-between focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors text-left"
      >
        <span className="truncate">{selectedOption ? selectedOption.label : placeholder}</span>
        <span className="material-symbols-outlined text-on-surface-variant text-sm pointer-events-none transition-transform duration-200" style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}>
          expand_more
        </span>
      </button>
      
      {isOpen && (
        <div className="absolute z-50 w-full mt-2 bg-[#1c2028]/95 backdrop-blur-3xl border border-white/10 rounded-lg shadow-[0_8px_32px_rgba(0,0,0,0.8)] overflow-hidden">
          <ul className="max-h-60 overflow-y-auto custom-scrollbar p-1.5 flex flex-col gap-0.5">
            {options.map((opt) => (
              <li
                key={opt.value}
                onClick={() => {
                  onChange(opt.value);
                  setIsOpen(false);
                }}
                className={`px-3 py-2.5 rounded-md cursor-pointer text-[13px] transition-colors flex items-center justify-between ${
                  value === opt.value 
                    ? 'bg-primary/20 text-primary border border-primary/20 font-medium shadow-[0_0_15px_rgba(173,198,255,0.1)]' 
                    : 'text-on-surface hover:bg-surface-variant/70 border border-transparent'
                }`}
              >
                <span className="truncate font-data-mono">{opt.label}</span>
                {value === opt.value && <span className="material-symbols-outlined text-[16px]">check</span>}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
