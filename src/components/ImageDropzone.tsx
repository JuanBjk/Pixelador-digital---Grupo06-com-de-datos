/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useState } from 'react';
import { Upload, Image as ImageIcon, Sparkles } from 'lucide-react';

interface ImageDropzoneProps {
  onImageSelected: (file: File) => void;
  onSelectPreset: (id: string) => void;
  activePresetId: string | null;
  presets: Array<{ id: string; name: string; category: string }>;
}

export default function ImageDropzone({
  onImageSelected,
  onSelectPreset,
  activePresetId,
  presets,
}: ImageDropzoneProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith('image/')) {
        onImageSelected(file);
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onImageSelected(e.target.files[0]);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Drag & Drop Area */}
      <div
        id="image-dropzone"
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`relative flex flex-col items-center justify-center p-5 border border-dashed rounded-lg cursor-pointer transition select-none min-h-[140px] ${
          isDragOver
            ? 'border-zinc-400 bg-zinc-800'
            : 'border-zinc-800 hover:border-zinc-700 bg-zinc-900/50'
        }`}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="image/*"
          className="hidden"
          id="file-input-element"
        />

        <div className="flex flex-col items-center text-center gap-2">
          <div className="p-2.5 bg-zinc-900 rounded-lg text-zinc-400 border border-zinc-800">
            <Upload size={18} className="text-zinc-350" />
          </div>
          <div className="text-xs font-semibold text-zinc-200">
            Arrastra tu propia imagen aquí o{' '}
            <span className="text-zinc-400 underline decoration-zinc-600 hover:text-zinc-100">explorar archivos</span>
          </div>
          <p className="text-[10px] text-zinc-500 max-w-xs leading-normal">
            Sustenta formatos PNG, JPEG y WEBP. El procesamiento se ejecuta en tu navegador.
          </p>
        </div>
      </div>

      {/* Preset Selector */}
      <div>
        <div className="flex items-center gap-1.5 mb-2">
          <h4 className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider">
            Imagenes de prueba
          </h4>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {presets.map((preset) => {
            const isActive = activePresetId === preset.id;
            return (
              <button
                key={preset.id}
                id={`preset-btn-${preset.id}`}
                onClick={() => onSelectPreset(preset.id)}
                className={`flex flex-col items-start p-2 text-left rounded-lg border transition ${
                  isActive
                    ? 'border-zinc-400 bg-zinc-800 text-zinc-100'
                    : 'border-zinc-800 bg-zinc-900/60 text-zinc-400 hover:border-zinc-700'
                }`}
              >
                <div className="flex items-center gap-1.5 w-full">
                  <ImageIcon size={12} className={isActive ? 'text-zinc-300' : 'text-zinc-600'} />
                  <span className="text-[11px] font-bold truncate">{preset.name}</span>
                </div>
                <span className={`text-[9px] truncate mt-0.5 ${isActive ? 'text-zinc-400' : 'text-zinc-650'}`}>
                  {preset.category}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
