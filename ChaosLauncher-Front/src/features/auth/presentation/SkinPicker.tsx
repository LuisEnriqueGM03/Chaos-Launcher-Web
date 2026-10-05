import React, { useState } from 'react';
import { MinecraftSlot } from '../../../shared/components/MinecraftSlot';
import { MinecraftInput } from '../../../shared/components/MinecraftInput';

interface SkinPickerProps {
  selectedUrl: string;
  onSelectSkin: (url: string) => void;
}

const PRESET_SKINS = [
  { name: 'Steve', url: 'https://mc-heads.net/avatar/MHF_Steve/100' },
  { name: 'Alex', url: 'https://mc-heads.net/avatar/MHF_Alex/100' },
  { name: 'Herobrine', url: 'https://mc-heads.net/avatar/MHF_Herobrine/100' },
  { name: 'Creeper', url: 'https://mc-heads.net/avatar/MHF_Creeper/100' },
];

export const SkinPicker: React.FC<SkinPickerProps> = ({ selectedUrl, onSelectSkin }) => {
  const [customUsername, setCustomUsername] = useState('');

  const handleApplyCustom = () => {
    if (customUsername.trim()) {
      const url = `https://mc-heads.net/avatar/${encodeURIComponent(customUsername.trim())}/100`;
      onSelectSkin(url);
    }
  };

  return (
    <div className="space-y-3">
      <label className="block font-minecraft font-bold text-xs uppercase tracking-wider text-slate-300">
        Avatar / Cabeza de Minecraft
      </label>

      {/* Preset heads */}
      <div className="flex items-center gap-3">
        {PRESET_SKINS.map((preset) => {
          const isSelected = selectedUrl === preset.url;
          return (
            <button
              key={preset.name}
              type="button"
              onClick={() => onSelectSkin(preset.url)}
              className="group focus:outline-none cursor-pointer"
              title={preset.name}
            >
              <MinecraftSlot
                size="md"
                className={`transition-all ${
                  isSelected ? 'border-amber-400 shadow-[0_0_8px_#f59e0b]' : 'opacity-70 group-hover:opacity-100'
                }`}
              >
                <img src={preset.url} alt={preset.name} className="w-8 h-8 object-cover" />
              </MinecraftSlot>
              <span className="block text-[10px] font-minecraft text-center text-stone-400 mt-1">
                {preset.name}
              </span>
            </button>
          );
        })}
      </div>

      {/* Custom username avatar */}
      <div className="flex items-end gap-2 pt-1">
        <div className="flex-1">
          <MinecraftInput
            label="O escribe tu usuario de Minecraft:"
            placeholder="Ej: Notch, Technoblade..."
            value={customUsername}
            onChange={(e) => setCustomUsername(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleApplyCustom();
              }
            }}
          />
        </div>
        <button
          type="button"
          onClick={handleApplyCustom}
          className="minecraft-btn-lava px-3 py-2 text-xs font-minecraft mb-[1px]"
        >
          Cargar
        </button>
      </div>
    </div>
  );
};
