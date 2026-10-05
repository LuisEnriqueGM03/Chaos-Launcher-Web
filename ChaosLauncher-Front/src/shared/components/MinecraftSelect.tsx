'use client';

import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check, Palette } from 'lucide-react';

export interface SelectOption {
  value: string;
  label: string;
  sublabel?: string;
  colorHex?: string;
  icon?: React.ReactNode;
}

interface MinecraftSelectProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  allowCustomColor?: boolean;
  className?: string;
}

export const MinecraftSelect: React.FC<MinecraftSelectProps> = ({
  label,
  value,
  onChange,
  options,
  placeholder = 'Seleccionar...',
  allowCustomColor = false,
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [customHex, setCustomHex] = useState(value.startsWith('#') ? value : '#ef4444');
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((opt) => opt.value === value);

  // Close dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [isOpen]);

  const handleSelect = (val: string) => {
    onChange(val);
    setIsOpen(false);
  };

  const handleCustomColorApply = () => {
    if (customHex.trim()) {
      onChange(customHex.trim());
      setIsOpen(false);
    }
  };

  return (
    <div className={`space-y-1.5 relative select-none ${className}`} ref={containerRef}>
      {label && (
        <label className="block font-minecraft font-bold text-xs uppercase tracking-wider text-slate-300">
          {label}
        </label>
      )}

      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-none minecraft-input text-xs text-white font-minecraft cursor-pointer transition focus:outline-none focus:border-amber-500 hover:border-stone-500"
      >
        <div className="flex items-center gap-2.5 min-w-0 flex-1 truncate">
          {selectedOption ? (
            <>
              {selectedOption.colorHex && (
                <span
                  className="w-4 h-4 rounded-none border border-black shadow-inner shrink-0"
                  style={{ backgroundColor: selectedOption.colorHex }}
                />
              )}
              {selectedOption.icon && <span className="shrink-0">{selectedOption.icon}</span>}
              <span className="truncate text-white font-bold">{selectedOption.label}</span>
              {selectedOption.sublabel && (
                <span className="text-[10px] text-stone-400 font-normal truncate">
                  ({selectedOption.sublabel})
                </span>
              )}
              {selectedOption.colorHex && (
                <span className="text-[10px] font-mono text-amber-300 ml-auto mr-2 shrink-0">
                  {selectedOption.colorHex}
                </span>
              )}
            </>
          ) : value && value.startsWith('#') ? (
            <>
              <span
                className="w-4 h-4 rounded-none border border-black shadow-inner shrink-0"
                style={{ backgroundColor: value }}
              />
              <span className="truncate text-white font-bold">Color Personalizado</span>
              <span className="text-[10px] font-mono text-amber-300 ml-auto mr-2 shrink-0">
                {value}
              </span>
            </>
          ) : (
            <span className="text-stone-500 font-normal">{placeholder}</span>
          )}
        </div>

        <ChevronDown
          className={`w-4 h-4 text-stone-400 shrink-0 transition-transform ${
            isOpen ? 'rotate-180 text-amber-400' : ''
          }`}
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 z-50 minecraft-panel bg-[#140b0b] border-2 border-stone-800 shadow-2xl p-1.5 space-y-1 animate-in fade-in duration-100 max-h-64 overflow-y-auto">
          {options.map((opt) => {
            const isSelected = opt.value === value;
            return (
              <div
                key={opt.value}
                onClick={() => handleSelect(opt.value)}
                className={`w-full flex items-center justify-between p-2 rounded-none text-xs font-minecraft cursor-pointer transition ${
                  isSelected
                    ? 'minecraft-card border-amber-500/70 bg-[#251010] text-amber-300 font-bold'
                    : 'text-stone-300 hover:bg-stone-800/60 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  {opt.colorHex && (
                    <span
                      className="w-4 h-4 rounded-none border border-black shadow-inner shrink-0"
                      style={{ backgroundColor: opt.colorHex }}
                    />
                  )}
                  {opt.icon && <span className="shrink-0">{opt.icon}</span>}
                  <span className="truncate">{opt.label}</span>
                  {opt.sublabel && (
                    <span className="text-[10px] text-stone-400 truncate">({opt.sublabel})</span>
                  )}
                </div>

                <div className="flex items-center gap-2 shrink-0 ml-2">
                  {opt.colorHex && (
                    <span className="text-[10px] font-mono text-stone-400">{opt.colorHex}</span>
                  )}
                  {isSelected && <Check className="w-3.5 h-3.5 text-amber-400" />}
                </div>
              </div>
            );
          })}

          {/* Custom color picker section */}
          {allowCustomColor && (
            <div className="pt-2 mt-1 border-t border-stone-800/80 p-2 space-y-2 bg-black/40">
              <div className="flex items-center gap-1.5 text-[10px] font-minecraft text-amber-400/90 uppercase tracking-wider">
                <Palette className="w-3 h-3" />
                <span>O elegir color HEX personalizado:</span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={customHex}
                  onChange={(e) => setCustomHex(e.target.value)}
                  className="w-8 h-8 rounded-none border border-black cursor-pointer bg-black shrink-0 p-0"
                />
                <input
                  type="text"
                  value={customHex}
                  onChange={(e) => setCustomHex(e.target.value)}
                  placeholder="#000000"
                  className="flex-1 px-2.5 py-1 text-xs font-mono text-white bg-black border border-stone-700 rounded-none focus:outline-none focus:border-amber-500"
                />
                <button
                  type="button"
                  onClick={handleCustomColorApply}
                  className="minecraft-btn-amber px-2.5 py-1 text-xs font-minecraft text-white cursor-pointer"
                >
                  USAR
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
