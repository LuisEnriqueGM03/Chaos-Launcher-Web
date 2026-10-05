'use client';

import React, { useState, useRef, useEffect } from 'react';
import { 
  X, 
  Upload, 
  ZoomIn, 
  ZoomOut, 
  Move, 
  Check, 
  AlertCircle, 
  Crop,
  Layers,
  Image as ImageIcon
} from 'lucide-react';
import { MinecraftButton } from './MinecraftButton';
import { MinecraftPanel } from './MinecraftPanel';
import { modpacksApi } from '../../features/modpacks/infrastructure/modpacks.api';

interface MinecraftImageAdjusterProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (url: string) => void;
  targetWidth: number;
  targetHeight: number;
  title?: string;
  category?: 'icons' | 'wallpapers' | 'general';
  initialImageUrl?: string;
}

export const MinecraftImageAdjuster: React.FC<MinecraftImageAdjusterProps> = ({
  isOpen,
  onClose,
  onSave,
  targetWidth,
  targetHeight,
  title = 'AJUSTAR DIMENSIONES DE IMAGEN',
  category = 'wallpapers',
  initialImageUrl = '',
}) => {
  const [imageSrc, setImageSrc] = useState<string>(initialImageUrl);
  const [zoom, setZoom] = useState<number>(1);
  const [panX, setPanX] = useState<number>(0);
  const [panY, setPanY] = useState<number>(0);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);

  const aspectRatio = targetWidth / targetHeight;

  useEffect(() => {
    if (isOpen) {
      setImageSrc(initialImageUrl || '');
      setZoom(1);
      setPanX(0);
      setPanY(0);
      setError(null);
    }
  }, [isOpen, initialImageUrl]);

  // Cargar imagen en memoria cuando cambia imageSrc
  useEffect(() => {
    if (!imageSrc) {
      imgRef.current = null;
      return;
    }
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = imageSrc;
    img.onload = () => {
      imgRef.current = img;
      drawPreview();
    };
    img.onerror = () => {
      setError('No se pudo cargar la imagen seleccionada. Intenta con otra o sube un archivo.');
    };
  }, [imageSrc]);

  // Redibujar el canvas de previsualización interactivo
  useEffect(() => {
    drawPreview();
  }, [zoom, panX, panY]);

  const drawPreview = () => {
    const canvas = canvasRef.current;
    const img = imgRef.current;
    if (!canvas || !img) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Limpiar canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Dibujar cuadrícula sutil de transparencia
    const gridSize = 16;
    for (let x = 0; x < canvas.width; x += gridSize) {
      for (let y = 0; y < canvas.height; y += gridSize) {
        ctx.fillStyle = (Math.floor(x / gridSize) + Math.floor(y / gridSize)) % 2 === 0 ? '#141414' : '#222222';
        ctx.fillRect(x, y, gridSize, gridSize);
      }
    }

    ctx.save();
    ctx.translate(canvas.width / 2 + panX, canvas.height / 2 + panY);
    ctx.scale(zoom, zoom);

    // Dibujar imagen centrada
    const drawWidth = canvas.width;
    const drawHeight = (img.height / img.width) * drawWidth;
    ctx.drawImage(img, -drawWidth / 2, -drawHeight / 2, drawWidth, drawHeight);

    ctx.restore();
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    const objectUrl = URL.createObjectURL(file);
    setImageSrc(objectUrl);
    setPanX(0);
    setPanY(0);
    setZoom(1);
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - panX, y: e.clientY - panY });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDragging) return;
    setPanX(e.clientX - dragStart.x);
    setPanY(e.clientY - dragStart.y);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleExportAndSave = async () => {
    const img = imgRef.current;
    if (!img) {
      setError('Por favor selecciona o sube una imagen primero.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // 1. Renderizar a canvas con las dimensiones exactas solicitadas (1900x550 o 1920x1080)
      const exportCanvas = document.createElement('canvas');
      exportCanvas.width = targetWidth;
      exportCanvas.height = targetHeight;
      const ctx = exportCanvas.getContext('2d');

      if (!ctx) throw new Error('No se pudo inicializar el contexto del lienzo.');

      // Mantener transparencia alfa pura (sin fondo negro forzado)
      ctx.clearRect(0, 0, targetWidth, targetHeight);

      // Calcular factor de escala entre preview y exportCanvas
      const previewCanvas = canvasRef.current;
      const scaleFactor = previewCanvas ? targetWidth / previewCanvas.width : 1;

      ctx.save();
      ctx.translate(targetWidth / 2 + panX * scaleFactor, targetHeight / 2 + panY * scaleFactor);
      ctx.scale(zoom * scaleFactor, zoom * scaleFactor);

      const baseWidth = previewCanvas ? previewCanvas.width : targetWidth;
      const drawWidth = baseWidth;
      const drawHeight = (img.height / img.width) * drawWidth;
      ctx.drawImage(img, -drawWidth / 2, -drawHeight / 2, drawWidth, drawHeight);
      ctx.restore();

      // 2. Convertir a Blob y subir a API
      const blob = await new Promise<Blob | null>((resolve) =>
        exportCanvas.toBlob((b) => resolve(b), 'image/png', 0.95),
      );

      if (!blob) throw new Error('Error al procesar el archivo gráfico.');

      const file = new File([blob], `adjusted_${targetWidth}x${targetHeight}_${Date.now()}.png`, {
        type: 'image/png',
      });

      const res = await modpacksApi.uploadImage(file, category);
      onSave(res.url);
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Error al procesar y subir la imagen');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in duration-150 select-none">
      <div className="w-full max-w-4xl relative">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 p-1.5 minecraft-slot text-stone-400 hover:text-white z-10 cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        <MinecraftPanel
          title={title}
          subtitle={`Ajusta la posición y escala para cumplir las medidas exactas requeridas: ${targetWidth} x ${targetHeight} px.`}
          icon={<Crop className="w-5 h-5 text-amber-400" />}
          className="space-y-4"
        >
          {error && (
            <div className="p-3 minecraft-card border-red-500/70 text-red-300 text-xs font-minecraft flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Selector de Archivo o URL */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-3 minecraft-slot bg-[#0a0505] border-stone-800">
            <div className="flex items-center gap-2">
              <label className="minecraft-btn-lava px-3 py-1.5 text-xs font-minecraft cursor-pointer flex items-center gap-2">
                <Upload className="w-3.5 h-3.5" />
                <span>Subir archivo</span>
                <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
              </label>

              <span className="text-[10px] font-minecraft text-stone-400">
                (PNG, JPG o WebP)
              </span>
            </div>

            <div className="flex items-center gap-2 text-xs font-minecraft">
              <span className="text-stone-400">Medida Objetivo:</span>
              <span className="px-2 py-0.5 font-bold text-amber-400 minecraft-slot bg-black">
                {targetWidth} × {targetHeight} px ({aspectRatio.toFixed(2)}:1)
              </span>
            </div>
          </div>

          {/* Canvas Interactivo de Recorte */}
          <div className="space-y-2">
            <div className="relative w-full overflow-hidden minecraft-card bg-black border-2 border-stone-700 flex items-center justify-center min-h-[260px] sm:min-h-[340px]">
              {imageSrc ? (
                <canvas
                  ref={canvasRef}
                  width={680}
                  height={Math.round(680 / aspectRatio)}
                  onMouseDown={handleMouseDown}
                  onMouseMove={handleMouseMove}
                  onMouseUp={handleMouseUp}
                  onMouseLeave={handleMouseUp}
                  className="w-full h-auto max-h-[380px] object-contain cursor-grab active:cursor-grabbing border-2 border-amber-500/40 shadow-2xl"
                />
              ) : (
                <div className="flex flex-col items-center justify-center p-12 text-center text-stone-500 space-y-2">
                  <ImageIcon className="w-12 h-12 text-stone-700" />
                  <span className="font-minecraft text-xs">
                    Ninguna imagen seleccionada. Sube un archivo para comenzar el ajuste.
                  </span>
                </div>
              )}

              {/* Guía visual overlay */}
              {imageSrc && (
                <div className="absolute top-2 left-2 px-2 py-1 bg-black/70 text-[10px] font-minecraft text-amber-300 pointer-events-none flex items-center gap-1 border border-amber-600/40">
                  <Move className="w-3 h-3" />
                  <span>Arrastra para mover la imagen dentro del encuadre</span>
                </div>
              )}
            </div>

            {/* Controles de Zoom y Ajustes */}
            {imageSrc && (
              <div className="flex flex-wrap items-center justify-between gap-4 p-3 minecraft-slot bg-[#0d0707] border-stone-800 text-xs font-minecraft">
                <div className="flex items-center gap-3 flex-1 min-w-[200px]">
                  <ZoomOut className="w-4 h-4 text-stone-400" />
                  <input
                    type="range"
                    min="0.5"
                    max="2.5"
                    step="0.05"
                    value={zoom}
                    onChange={(e) => setZoom(parseFloat(e.target.value))}
                    className="w-full h-2 rounded-none bg-black accent-amber-500 cursor-pointer"
                  />
                  <ZoomIn className="w-4 h-4 text-stone-400" />
                  <span className="text-amber-400 font-bold min-w-[45px] text-right">
                    {(zoom * 100).toFixed(0)}%
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setZoom(1);
                    setPanX(0);
                    setPanY(0);
                  }}
                  className="minecraft-btn-gray px-2.5 py-1 text-[10px] text-stone-300 hover:text-white"
                >
                  Centrar
                </button>
              </div>
            )}
          </div>

          {/* Botones de Acción */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t-2 border-black">
            <button
              type="button"
              onClick={onClose}
              className="minecraft-btn-gray px-4 py-2 text-xs font-minecraft cursor-pointer"
            >
              Cancelar
            </button>

            <MinecraftButton
              variant="green"
              size="md"
              disabled={!imageSrc || loading}
              isLoading={loading}
              onClick={handleExportAndSave}
              className="flex items-center gap-2"
            >
              <Check className="w-4 h-4" />
              <span>APLICAR Y GUARDAR ({targetWidth}×{targetHeight})</span>
            </MinecraftButton>
          </div>
        </MinecraftPanel>
      </div>
    </div>
  );
};
