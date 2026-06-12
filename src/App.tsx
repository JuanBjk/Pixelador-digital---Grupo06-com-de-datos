/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { 
  Sliders, 
  Download, 
  HelpCircle, 
  Sparkles, 
  RefreshCw, 
  HardDrive, 
  TrendingDown, 
  Dices, 
  ChevronRight, 
  Binary, 
  Grid3X3,
  Minimize2,
  ListFilter,
  Maximize2,
  ExternalLink
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

import { PRESETIMAGES } from './components/PresetGenerator';
import { DigitizeSettings, ProcessedStats } from './types';
import ImageDropzone from './components/ImageDropzone';
import EducationalInfo from './components/EducationalInfo';

export default function App() {
  // Preset Selection state (Defaults to the gorgeous sunset mountain)
  const [activePresetId, setActivePresetId] = useState<string | null>('sunset');
  const [customImageSrc, setCustomImageSrc] = useState<string | null>(null);
  
  // Settings state
  const [settings, setSettings] = useState<DigitizeSettings>({
    resolutionWidth: 64,
    bitDepth: 4,
    paletteType: 'standard',
    showGrid: false,
    zoom: 1,
  });

  // Display and compare layouts
  const [viewMode, setViewMode] = useState<'side-by-side' | 'slider-split'>('slider-split');
  const [sliderPosition, setSliderPosition] = useState<number>(50); // 0 to 100 percent
  const [isDraggingSlider, setIsDraggingSlider] = useState<boolean>(false);
  const [hoverCoords, setHoverCoords] = useState<{ x: number; y: number } | null>(null);

  // Stats
  const [stats, setStats] = useState<ProcessedStats | null>(null);
  const [downloadFormat, setDownloadFormat] = useState<'png' | 'jpeg' | 'webp'>('png');

  // References
  const originalCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const processedCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const splitOriginalCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const splitProcessedCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const sideOriginalCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const sideProcessedCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [containerDimensions, setContainerDimensions] = useState({ width: 0, height: 0 });

  // Load preset or custom image into Original Canvas
  useEffect(() => {
    const canvas = originalCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    if (activePresetId) {
      // Procedural Drawing
      const preset = PRESETIMAGES.find(p => p.id === activePresetId);
      if (preset) {
        // We set fixed standard dimension for high quality original (e.g., 640x480)
        canvas.width = 640;
        canvas.height = 480;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        preset.draw(ctx, canvas.width, canvas.height);
        processImage();
      }
    } else if (customImageSrc) {
      // User Uploaded Image Element
      const img = new Image();
      img.onload = () => {
        // Enforce max dimension to keep processing fast and light
        const maxDim = 800;
        let w = img.width;
        let h = img.height;
        if (w > maxDim || h > maxDim) {
          if (w > h) {
            h = Math.round((h * maxDim) / w);
            w = maxDim;
          } else {
            w = Math.round((w * maxDim) / h);
            h = maxDim;
          }
        }
        canvas.width = w;
        canvas.height = h;
        ctx.clearRect(0, 0, w, h);
        ctx.drawImage(img, 0, 0, w, h);
        processImage();
      };
      img.src = customImageSrc;
    }
  }, [activePresetId, customImageSrc]);

  // Re-process when settings change
  useEffect(() => {
    processImage();
  }, [settings]);

  // Handle Resize of the viewport container to map mouse positions accurately
  useEffect(() => {
    const handleResize = () => {
      const container = containerRef.current;
      if (container) {
        setContainerDimensions({
          width: container.clientWidth,
          height: container.clientHeight || 360, // Fallback index
        });
      }
    };

    // Delay briefly to allow Layout to stabilize
    const timeout = setTimeout(handleResize, 150);
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(timeout);
    };
  }, [viewMode, activePresetId, customImageSrc]);

  // Re-render display canvases whenever processed content, view mode, or display settings update
  useEffect(() => {
    const origSrc = originalCanvasRef.current;
    const procSrc = processedCanvasRef.current;
    if (!origSrc || !procSrc) return;

    // 1. Draw to split elements (slider split view)
    const splitOrig = splitOriginalCanvasRef.current;
    const splitProc = splitProcessedCanvasRef.current;
    if (splitOrig) {
      splitOrig.width = origSrc.width;
      splitOrig.height = origSrc.height;
      const ctx = splitOrig.getContext('2d');
      ctx?.drawImage(origSrc, 0, 0);
    }
    if (splitProc) {
      splitProc.width = procSrc.width;
      splitProc.height = procSrc.height;
      const ctx = splitProc.getContext('2d');
      if (ctx) {
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(procSrc, 0, 0);
      }
    }

    // 2. Draw to side elements (side-by-side view)
    const sideOrig = sideOriginalCanvasRef.current;
    const sideProc = sideProcessedCanvasRef.current;
    if (sideOrig) {
      sideOrig.width = origSrc.width;
      sideOrig.height = origSrc.height;
      const ctx = sideOrig.getContext('2d');
      ctx?.drawImage(origSrc, 0, 0);
    }
    if (sideProc) {
      sideProc.width = procSrc.width;
      sideProc.height = procSrc.height;
      const ctx = sideProc.getContext('2d');
      if (ctx) {
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(procSrc, 0, 0);
      }
    }
  }, [stats, viewMode, settings.showGrid, settings.zoom]);

  // Process image: Downsample + Quantize RGB + Upsample pixelated
  const processImage = () => {
    const origCanvas = originalCanvasRef.current;
    const procCanvas = processedCanvasRef.current;
    if (!origCanvas || !procCanvas) return;

    const origCtx = origCanvas.getContext('2d', { willReadFrequently: true });
    const procCtx = procCanvas.getContext('2d', { willReadFrequently: true });
    if (!origCtx || !procCtx) return;

    const ow = origCanvas.width;
    const oh = origCanvas.height;
    const aspect = ow / oh;

    // Define sampling dimension (Resolución)
    const sw = settings.resolutionWidth;
    const sh = Math.max(1, Math.round(sw / aspect));

    // Create an in-memory small canvas for the pixelated middle tier
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = sw;
    tempCanvas.height = sh;
    const tempCtx = tempCanvas.getContext('2d', { willReadFrequently: true });
    if (!tempCtx) return;

    // Phase 1: Spatial Sampling (Muestreo)
    // Draw original scaled down to pixelated grid
    tempCtx.drawImage(origCanvas, 0, 0, sw, sh);
    const imgData = tempCtx.getImageData(0, 0, sw, sh);
    const data = imgData.data;

    // Color depth configuration
    const bDepth = settings.bitDepth;

    // Helper to quantize a single channel (0-255) into b bits
    const quantizeChannel = (v: number, bits: number): number => {
      if (bits === 0) return 0;
      if (bits >= 8) return v;
      const levels = Math.pow(2, bits);
      const step = Math.round((v / 255) * (levels - 1));
      return Math.round(step * (255 / (levels - 1)));
    };

    // Helper for Hex conversion
    const parseHexColor = (hex: string) => {
      const r = parseInt(hex.slice(1, 3), 16);
      const g = parseInt(hex.slice(3, 5), 16);
      const b = parseInt(hex.slice(5, 7), 16);
      return { r, g, b };
    };

    // Phase 2: Amplitude Quantization (Cuantización)
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];

      if (settings.paletteType === 'grayscale') {
        const grayscale = Math.round(0.299 * r + 0.587 * g + 0.114 * b);
        // Quantize gray coordinate
        const quantized = quantizeChannel(grayscale, Math.min(bDepth, 8));
        data[i] = quantized;
        data[i + 1] = quantized;
        data[i + 2] = quantized;
      } else {
        // 'standard' option - Channel bit division based on bitDepth
        let rBits = 8;
        let gBits = 8;
        let bBits = 8;

        if (bDepth === 1) {
          // B&W Monochrome thresholding
          const lum = 0.299 * r + 0.587 * g + 0.114 * b;
          const val = lum >= 128 ? 255 : 0;
          rBits = 0; gBits = 0; bBits = 0;
          data[i] = val;
          data[i + 1] = val;
          data[i + 2] = val;
          continue;
        } else if (bDepth === 2) {
          // 4 colors (Black, green-phosphor etc, let's map simply)
          rBits = 1; gBits = 1; bBits = 0;
        } else if (bDepth === 3) {
          // 8 colors: 1 bit per channel (RGB)
          rBits = 1; gBits = 1; bBits = 1;
        } else if (bDepth === 4) {
          // 16 colors (2 red, 1 green, 1 blue)
          rBits = 2; gBits = 1; bBits = 1;
        } else if (bDepth === 6) {
          // 64 colors (2, 2, 2)
          rBits = 2; gBits = 2; bBits = 2;
        } else if (bDepth === 8) {
          // 256 colors standard VGA
          rBits = 3; gBits = 3; bBits = 2;
        } else if (bDepth === 12) {
          // 4096 colors
          rBits = 4; gBits = 4; bBits = 4;
        } else if (bDepth === 16) {
          // High color
          rBits = 5; gBits = 6; bBits = 5;
        }

        data[i] = quantizeChannel(r, rBits);
        data[i + 1] = quantizeChannel(g, gBits);
        data[i + 2] = quantizeChannel(b, bBits);
      }
    }

    tempCtx.putImageData(imgData, 0, 0);

    // Resize processed canvas to match original resolution physically, but sharp
    procCanvas.width = ow;
    procCanvas.height = oh;
    procCtx.clearRect(0, 0, ow, oh);
    procCtx.imageSmoothingEnabled = false;
    procCtx.drawImage(tempCanvas, 0, 0, ow, oh);

    // Compute mathematical MSE & PSNR comparison against original array
    const origData = origCtx.getImageData(0, 0, ow, oh).data;
    const procData = procCtx.getImageData(0, 0, ow, oh).data;

    let sumSqErr = 0;
    const len = origData.length;
    const pixelCount = len / 4;

    for (let i = 0; i < len; i += 4) {
      const dr = origData[i] - procData[i];
      const dg = origData[i + 1] - procData[i + 1];
      const db = origData[i + 2] - procData[i + 2];
      sumSqErr += (dr * dr + dg * dg + db * db) / 3;
    }

    const mse = sumSqErr / pixelCount;
    const psnr = mse === 0 ? 0 : 10 * Math.log10((255 * 255) / mse);

    // Calculate simulated uncompressed sizes in bits
    const bitsOriginal = ow * oh * 24;
    // Processed theoretical bits based on selection (Grayscale uses same bitDepth)
    const bitsProcessed = sw * sh * bDepth;

    setStats({
      originalWidth: ow,
      originalHeight: oh,
      processedWidth: sw,
      processedHeight: sh,
      bitsOriginal,
      bitsProcessed,
      mse,
      psnr,
    });
  };

  const selectPreset = (id: string) => {
    setActivePresetId(id);
    setCustomImageSrc(null);
  };

  const handleCustomImage = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        setCustomImageSrc(e.target.result as string);
        setActivePresetId(null);
      }
    };
    reader.readAsDataURL(file);
  };

  // Human-legible File Sizes
  const formatBitSize = (bits: number) => {
    const bytes = bits / 8;
    if (bytes < 1024) return `${bytes.toFixed(0)} Bytes`;
    const kb = bytes / 1024;
    if (kb < 1024) return `${kb.toFixed(1)} KB`;
    return `${(kb / 1024).toFixed(2)} MB`;
  };

  // Viewport Drag Slider Logic
  const handleSplitMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const container = containerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const x = Math.max(0, Math.min(rect.width, e.clientX - rect.left));
    const y = Math.max(0, Math.min(rect.height, e.clientY - rect.top));

    // Capture coordinates for the Pixel inspector
    setHoverCoords({ x, y });

    if (isDraggingSlider || e.buttons === 1) {
      const percentage = (x / rect.width) * 100;
      setSliderPosition(percentage);
    }
  };

  const handleSplitTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    const container = containerRef.current;
    if (!container || e.touches.length === 0) return;
    const rect = container.getBoundingClientRect();
    const touch = e.touches[0];
    const x = Math.max(0, Math.min(rect.width, touch.clientX - rect.left));
    const y = Math.max(0, Math.min(rect.height, touch.clientY - rect.top));

    setHoverCoords({ x, y });
    const percentage = (x / rect.width) * 100;
    setSliderPosition(percentage);
  };

  const handleMouseLeave = () => {
    setIsDraggingSlider(false);
    setHoverCoords(null);
  };

  // Triggers canvas image downloading
  const handleDownload = () => {
    const procCanvas = processedCanvasRef.current;
    if (!procCanvas) return;
    
    // Create download link anchor
    const link = document.createElement('a');
    const extension = downloadFormat === 'jpeg' ? 'jpg' : downloadFormat;
    const mimeMap = {
      png: 'image/png',
      jpeg: 'image/jpeg',
      webp: 'image/webp'
    };
    link.download = `pixelado_${settings.resolutionWidth}px_${settings.paletteType}_${settings.bitDepth}bit.${extension}`;
    link.href = procCanvas.toDataURL(mimeMap[downloadFormat]);
    link.click();
  };

  // Quick settings preset combinations representing university lab config cases
  const applyVisualPreset = (type: 'low-res' | 'black-white' | 'grayscale-4bit' | 'high-fidelity') => {
    if (type === 'low-res') {
      setSettings(prev => ({ ...prev, resolutionWidth: 32, bitDepth: 3, paletteType: 'standard' }));
    } else if (type === 'black-white') {
      setSettings(prev => ({ ...prev, resolutionWidth: 128, bitDepth: 1, paletteType: 'standard' }));
    } else if (type === 'grayscale-4bit') {
      setSettings(prev => ({ ...prev, resolutionWidth: 64, bitDepth: 4, paletteType: 'grayscale' }));
    } else if (type === 'high-fidelity') {
      setSettings(prev => ({ ...prev, resolutionWidth: 128, bitDepth: 8, paletteType: 'standard' }));
    }
  };

  // Space savings calculations
  const reductionPercentage = stats ? ((stats.bitsOriginal - stats.bitsProcessed) / stats.bitsOriginal) * 100 : 0;

  return (
    <div className="min-h-screen bg-zinc-950 font-sans text-zinc-100 antialiased selection:bg-zinc-800">
      
      {/* Off-screen canvas references */}
      <canvas ref={originalCanvasRef} className="hidden" />
      <canvas ref={processedCanvasRef} className="hidden" />

      {/* Primary Header Hero */}
      <header className="bg-zinc-900 border-b border-zinc-800 py-4 px-6 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div>
              <h1 className="text-base font-bold tracking-tight text-zinc-100 flex flex-wrap items-center gap-2">
                Trabajo Práctico Integrador: Simulador de Digitalización de Imágenes 
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 border border-zinc-750">
                  Grupo 6
                </span>
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
            <div className="flex items-center gap-1">
              <select
                id="download-format-select"
                value={downloadFormat}
                onChange={(e) => setDownloadFormat(e.target.value as any)}
                className="px-2 py-1.5 text-xs font-semibold rounded-lg border border-zinc-800 bg-zinc-900 text-zinc-300 cursor-pointer outline-none focus:ring-1 focus:ring-zinc-750"
              >
                <option value="png">PNG</option>
                <option value="jpeg">JPG</option>
                <option value="webp">WebP</option>
              </select>
              <button
                id="download-processed-btn"
                onClick={handleDownload}
                className="px-4 py-1.5 text-xs font-bold rounded-lg text-zinc-900 bg-zinc-200 hover:bg-zinc-100 cursor-pointer flex items-center gap-1.5 border border-zinc-300 shadow-sm"
              >
                <Download size={13} /> Descargar Imagen
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Body Grid */}
      <main className="max-w-7xl mx-auto p-4 md:p-6 lg:p-8 grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
            {/* Left Side: Setup & Sliders Controls (lg:grid-cols-5) */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Section 1: Image Sourcing */}
          <section className="bg-zinc-900 border border-zinc-800 rounded-lg p-5">
            <div className="flex items-center gap-2 mb-4">
              <h3 className="font-bold text-zinc-100 text-[12px] tracking-wider uppercase">
                1. Seleccione una imagen
              </h3>
            </div>
            <ImageDropzone
              onImageSelected={handleCustomImage}
              onSelectPreset={selectPreset}
              activePresetId={activePresetId}
              presets={PRESETIMAGES.map((p) => ({ id: p.id, name: p.name, category: p.category }))}
            />
          </section>

          {/* Section 2: Interactive Sliders parameters */}
          <section className="bg-zinc-900 border border-zinc-800 rounded-lg p-5 space-y-5">
            <div className="flex items-center gap-1.5 mb-1 text-zinc-100 pb-2 border-b border-zinc-800">
              <Sliders size={14} className="text-zinc-400" />
              <h3 className="font-bold text-xs tracking-wider uppercase">2. Controles de Digitalización</h3>
            </div>
                       {/* RESOLUTION SLIDER (MUESTREO) */}
            <div className="space-y-2 border border-zinc-800 bg-zinc-950/50 p-3.5 rounded-lg">
              <div className="flex justify-between items-center">
                <label htmlFor="resolution-slider" className="text-xs font-bold text-zinc-200">
                  Muestreo Espacial (Resolución)
                </label>
                <span className="text-xs font-semibold text-zinc-300 font-mono bg-zinc-800 border border-zinc-700 px-2 py-0.5 rounded">
                  {settings.resolutionWidth} px de ancho
                </span>
              </div>
              <p className="text-[10px] text-zinc-500">
                Discretización de coordenadas espaciales en píxeles
              </p>
              <input
                type="range"
                id="resolution-slider"
                min="8"
                max="256"
                step="4"
                value={settings.resolutionWidth}
                onChange={(e) => setSettings(prev => ({ ...prev, resolutionWidth: parseInt(e.target.value) }))}
                className="w-full h-1 rounded-lg bg-zinc-800 accent-zinc-200 cursor-pointer mt-2"
              />
              <div className="grid grid-cols-5 text-[9px] font-mono text-zinc-500 select-none px-0.5 pt-1">
                <span>8px (Lego)</span>
                <span className="text-center">32px</span>
                <span className="text-center">64px</span>
                <span className="text-center">128px</span>
                <span className="text-right">256px</span>
              </div>
            </div>

            {/* COLOR DEPTH SLIDER (CUANTIZACION) */}
            <div className="space-y-2 border border-zinc-800 bg-zinc-950/50 p-3.5 rounded-lg">
              <div className="flex justify-between items-center">
                <label htmlFor="bitdepth-slider" className="text-xs font-bold text-zinc-200">
                  Profundidad de Bits (Cuantización)
                </label>
                <span className="text-xs font-semibold text-zinc-300 font-mono bg-zinc-800 border border-zinc-700 px-2 py-0.5 rounded">
                  {settings.bitDepth} {settings.bitDepth === 1 ? 'Bit' : 'Bits'} {' '}
                  {settings.bitDepth === 24 ? '(16.7M Colores)' : `(${Math.pow(2, settings.bitDepth)} Tonos)`}
                </span>
              </div>
              <p className="text-[10px] text-zinc-500">
                Número de bits que codifican el color por pixel
              </p>
              <input
                type="range"
                id="bitdepth-slider"
                min="1"
                max="24"
                // Standard jumps: 1, 2, 3, 4, 6, 8, 12, 16, 24
                step="1"
                value={settings.bitDepth}
                onChange={(e) => {
                  const val = parseInt(e.target.value);
                  // Snap to closest standard bit configuration for perfect educational mapping
                  let snapped = val;
                  if (val > 12 && val < 24) {
                     snapped = val < 18 ? 16 : 24;
                  } else if (val > 8 && val < 12) {
                     snapped = 12;
                  } else if (val > 4 && val < 8) {
                     snapped = val < 6 ? 4 : 6;
                  }
                  setSettings(prev => ({ ...prev, bitDepth: snapped }));
                }}
                className="w-full h-1 rounded-lg bg-zinc-800 accent-zinc-200 cursor-pointer mt-2"
              />
              <div className="grid grid-cols-5 text-[9px] font-mono text-zinc-500 select-none px-0.5 pt-1">
                <span>1-bit (B&W)</span>
                <span className="text-center">3-bit</span>
                <span className="text-center">4-bit (Retro)</span>
                <span className="text-center">8-bit (VGA)</span>
                <span className="text-right">24-bit (HD)</span>
              </div>
            </div>

            {/* COLOR PALETTE DROPDOWN */}
            <div className="space-y-1.5">
              <label htmlFor="palette-select" className="text-xs font-bold text-zinc-300 block">
                Paleta / Rango de Amplitud Cromática
              </label>
              <select
                id="palette-select"
                value={settings.paletteType}
                onChange={(e) => {
                  const pType = e.target.value as any;
                  setSettings(prev => ({ ...prev, paletteType: pType }));
                }}
                className="w-full text-xs font-semibold bg-zinc-950 text-zinc-200 border border-zinc-800 rounded-lg px-3 py-2 focus:border-zinc-700 outline-none transition cursor-pointer"
              >
                <option value="standard">Sistemas Estándar R-G-B (Dinámico por Bits)</option>
                <option value="grayscale">Escala de Grises Monocroma (Luminancia pura)</option>
              </select>
            </div>

            {/* VISUAL VIEWER ADVANCED PROPERTIES */}
            <div className="pt-3 border-t border-zinc-800 grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-300 flex items-center gap-1.5">
                  <Grid3X3 size={12} className="text-zinc-500" /> Rejilla Píxeles
                </label>
                <div className="flex items-center">
                  <button
                    id="grid-toggle-btn"
                    onClick={() => setSettings(prev => ({ ...prev, showGrid: !prev.showGrid }))}
                    className={`relative inline-flex h-5 w-10 shrink-0 cursor-pointer rounded-full transition-colors duration-200 ease-in-out outline-none border border-transparent ${
                      settings.showGrid ? 'bg-zinc-400' : 'bg-zinc-800'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-zinc-950 shadow-md transition duration-200 ease-in-out mt-0.5 ${
                        settings.showGrid ? 'translate-x-5' : 'translate-x-0.5'
                      }`}
                    />
                  </button>
                  <span className="text-xs text-zinc-400 ml-2 font-semibold">
                    {settings.showGrid ? 'Activada' : 'Apagada'}
                  </span>
                </div>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="zoom-select" className="text-xs font-bold text-zinc-300 flex items-center gap-1.5">
                  <Maximize2 size={12} className="text-zinc-500" /> Escala / Zoom
                </label>
                <select
                  id="zoom-select"
                  value={settings.zoom}
                  onChange={(e) => setSettings(prev => ({ ...prev, zoom: parseFloat(e.target.value) }))}
                  className="w-full text-xs font-bold bg-zinc-950 text-zinc-205 border border-zinc-800 rounded-lg px-2 py-1.5 outline-none focus:border-zinc-700 cursor-pointer transition"
                >
                  <option value="1">100% Ajustado</option>
                  <option value="1.5">150% Ampliado</option>
                  <option value="2">200% Lupa x2</option>
                  <option value="4">400% Zoom Súper x4</option>
                </select>
              </div>
            </div>
          </section>

          {/* EDUCATIONAL FORMULAS BOARD */}
          <EducationalInfo />
        </div>

        {/* Right Side: Virtual Display and Scientific Stats Metrics (lg:grid-cols-7) */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* DISPLAY VIEWPORT CARD */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-5 space-y-5">
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800 pb-4">
              <div>
                <h3 className="font-bold text-zinc-200 text-sm flex items-center gap-2">
                  <HardDrive size={15} className="text-zinc-400" />
                  Comparador Óptico Digital
                </h3>
                <p className="text-[11px] text-zinc-400 mt-0.5">
                  {viewMode === 'slider-split' 
                    ? 'Arrastra la barra vertical para revelar la diferencia Original (Izquierda) vs. Digital (Derecha)'
                    : 'Alineación lado a lado de máxima calidad fotográfica para análisis cromático'}
                </p>
              </div>

              {/* Viewmode Toggles */}
              <div className="flex bg-zinc-950 p-1 rounded-lg self-start sm:self-center shrink-0 border border-zinc-800">
                <button
                  id="toggle-view-slider"
                  onClick={() => setViewMode('slider-split')}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-md transition cursor-pointer ${
                    viewMode === 'slider-split'
                      ? 'bg-zinc-800 text-zinc-100 border border-zinc-700'
                      : 'text-zinc-450 hover:text-zinc-250'
                  }`}
                >
                  Regla Desplazable
                </button>
                <button
                  id="toggle-view-sideby"
                  onClick={() => setViewMode('side-by-side')}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-md transition cursor-pointer ${
                    viewMode === 'side-by-side'
                      ? 'bg-zinc-800 text-zinc-100 border border-zinc-700'
                      : 'text-zinc-450 hover:text-zinc-250'
                  }`}
                >
                  Lado a Lado
                </button>
              </div>
            </div>

            {/* Screen Viewport Stages */}
            <div className="relative border border-zinc-800 rounded-lg overflow-hidden bg-zinc-950 flex items-center justify-center min-h-[300px]">
              
              {/* Dynamic Interactive Slide Slider Viewmode */}
              <div
                id="interactive-canvas-container"
                ref={containerRef}
                onMouseMove={handleSplitMouseMove}
                onTouchMove={handleSplitTouchMove}
                onMouseLeave={handleMouseLeave}
                className="relative w-full max-w-full aspect-[4/3] cursor-ew-resize select-none overflow-hidden"
                style={{
                  maxHeight: '480px',
                  display: viewMode === 'slider-split' ? 'block' : 'none',
                  transform: `scale(${settings.zoom})`,
                  transformOrigin: 'center center',
                  transition: 'transform 0.2s ease',
                }}
              >
                {/* Bottom / Base layer: Processed (Pixelated) Canvas */}
                <canvas
                  id="canvas-processed-image"
                  ref={splitProcessedCanvasRef}
                  className="absolute inset-0 w-full h-full object-contain pointer-events-none"
                  style={{
                    imageRendering: 'pixelated',
                  }}
                />

                {/* Pixel grid overlay drawing */}
                {settings.showGrid && (
                  <div
                    className="absolute inset-0 pointer-events-none opacity-20"
                    style={{
                      backgroundImage: `
                        linear-gradient(to right, rgba(255, 255, 255, 0.4) 1px, transparent 1px),
                        linear-gradient(to bottom, rgba(255, 255, 255, 0.4) 1px, transparent 1px)
                      `,
                      backgroundSize: `${containerDimensions.width / settings.resolutionWidth}px ${
                        containerDimensions.height / (stats ? Math.round(settings.resolutionWidth / (stats.originalWidth / stats.originalHeight)) : 48)
                      }px`,
                    }}
                  />
                )}

                {/* Top layer: Original Canvas with sliding clip-path width */}
                <div
                  className="absolute inset-x-0 top-0 bottom-0 pointer-events-none overflow-hidden"
                  style={{ width: `${sliderPosition}%` }}
                >
                  {/* Render original canvas visual mirror clone */}
                  <div 
                    className="absolute top-0 bottom-0 left-0"
                    style={{ width: `${containerDimensions.width}px`, height: `${containerDimensions.height}px` }}
                  >
                    <canvas
                      ref={splitOriginalCanvasRef}
                      className="w-full h-full object-contain"
                    />
                  </div>
                </div>

                {/* Boundary sliding indicator line */}
                <div
                  className="absolute top-0 bottom-0 w-px bg-zinc-500 pointer-events-none flex items-center justify-center"
                  style={{ left: `${sliderPosition}%` }}
                >
                  <div className="w-6 h-6 bg-zinc-900 rounded-full border border-zinc-700 flex items-center justify-center pointer-events-none text-[8px] text-zinc-400 shadow-lg">
                    ↔
                  </div>
                </div>

                {/* Labels Watermarks */}
                <div className="absolute top-4 left-4 px-2.5 py-1 rounded-lg bg-zinc-950/90 text-[9px] font-bold text-zinc-400 tracking-wider uppercase border border-zinc-800 select-none pointer-events-none">
                  Original
                </div>
                <div className="absolute top-4 right-4 px-2.5 py-1 rounded-lg bg-zinc-950/90 text-[9px] font-bold text-zinc-300 tracking-wider uppercase border border-zinc-800 select-none pointer-events-none">
                  Digitalizado
                </div>
              </div>

              {/* Side-by-Side Viewmode */}
              <div 
                className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 w-full"
                style={{ display: viewMode === 'side-by-side' ? 'grid' : 'none' }}
              >
                {/* Original Side */}
                <div className="flex flex-col gap-1.5">
                  <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider">
                    Imagen Original
                  </span>
                  <div className="relative border border-zinc-800 rounded-lg overflow-hidden aspect-[4/3] bg-zinc-950">
                    <canvas
                      ref={sideOriginalCanvasRef}
                      className="w-full h-full object-contain"
                    />
                    <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-zinc-950/90 border border-zinc-800 text-[9px] font-mono text-zinc-400">
                      {stats ? `${stats.originalWidth} x ${stats.originalHeight} px` : ''}
                    </div>
                  </div>
                </div>

                {/* Digitalized Side */}
                <div className="flex flex-col gap-1.5">
                  <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider">
                    Simulación ({settings.resolutionWidth}px)
                  </span>
                  <div className="relative border border-zinc-800 rounded-lg overflow-hidden aspect-[4/3] bg-zinc-950">
                    <canvas
                      ref={sideProcessedCanvasRef}
                      className="w-full h-full object-contain text-zinc-500"
                      style={{ imageRendering: 'pixelated' }}
                    />
                    <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-zinc-950/90 border border-zinc-800 text-[9px] font-mono text-zinc-400">
                      {stats ? `${stats.processedWidth} x ${stats.processedHeight} px` : ''}
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>

          {/* SCIENTIFIC STATISTICS AND MATH REDUCTION DETAILS CARD */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-5 space-y-5">
            <h3 className="font-extrabold text-[10px] tracking-wider text-zinc-400 uppercase flex items-center gap-1.5 pb-2 border-b border-zinc-800">
              <HardDrive size={13} className="text-zinc-500" />
              Análisis Métrico y Eficiencia de Flujo
            </h3>

            {stats ? (
              <div className="space-y-5">
                {/* 1. Size Comparison progress bars */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Original uncompressed size */}
                  <div className="p-4 rounded-lg border border-zinc-800 bg-zinc-950/40">
                    <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider block">
                      Tamaño Original Estimado
                    </span>
                    <h5 className="text-lg font-extrabold text-zinc-200 mt-1.5 font-mono">
                      {formatBitSize(stats.bitsOriginal)}
                    </h5>
                    <p className="text-[10px] text-zinc-500 mt-1">
                      Fórmula: {stats.originalWidth} × {stats.originalHeight} × 24-bits
                    </p>
                  </div>

                  {/* Processed uncompressed size */}
                  <div className="p-4 rounded-lg border border-zinc-800 bg-zinc-950/40">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider block">
                          Tamaño Procesado Estimado
                        </span>
                        <h5 className="text-lg font-extrabold text-zinc-200 mt-1.5 font-mono">
                          {formatBitSize(stats.bitsProcessed)}
                        </h5>
                      </div>
                      <div className="px-2 py-0.5 bg-zinc-850 text-zinc-300 text-[9px] font-mono rounded border border-zinc-700 flex items-center gap-1">
                        <TrendingDown size={11} /> {reductionPercentage.toFixed(1)}%
                      </div>
                    </div>
                    <p className="text-[10px] text-zinc-500 mt-1">
                      Fórmula: {stats.processedWidth} × {stats.processedHeight} × {settings.paletteType !== 'standard' ? '2' : settings.bitDepth}-bits
                    </p>
                  </div>
                </div>

                {/* 2. Unified Progress of reduction */}
                <div className="space-y-2 p-4 rounded-lg bg-zinc-950/20 border border-zinc-805">
                  <div className="flex justify-between text-xs items-center">
                    <span className="font-semibold text-zinc-400">Tasa de Compresión Sin Pérdida por Submuestreo:</span>
                    <span className="font-mono text-zinc-300 font-bold">
                      Ahorras el {reductionPercentage.toFixed(2)}% del almacenamiento
                    </span>
                  </div>
                  {/* High quality progress block */}
                  <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden flex">
                    <div 
                      className="bg-indigo-600 h-full transition-all duration-300"
                      style={{ width: `${100 - reductionPercentage}%` }}
                      title="Porción ocupada"
                    />
                    <div
                      className="bg-emerald-500 h-full transition-all duration-300"
                      style={{ width: `${reductionPercentage}%` }}
                      title="Ahorro de espacio"
                    />
                  </div>
                  <div className="flex justify-between text-[9px] font-mono text-zinc-500 select-none">
                    <span>Tamaño Procesado: {((100 - reductionPercentage).toFixed(1))}%</span>
                    <span>Espacio Libre: {reductionPercentage.toFixed(1)}%</span>
                  </div>
                </div>

                {/* 3. Scientific Fidelity Indices (MSE, PSNR) */}
                <div className="pt-4 grid grid-cols-2 gap-5 border-t border-zinc-800">
                  <div className="space-y-1">
                    <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider block">
                      Error Cuadrático Medio (MSE)
                    </span>
                    <h6 className="text-sm font-bold text-zinc-200 font-mono">
                      {stats.mse.toFixed(2)}
                    </h6>
                    <p className="text-[10.5px] text-zinc-450 leading-relaxed text-justify">
                      Mide la desviación promedio del color de píxeles originales comparado con el valor digitalizado. Entre menor sea, mayor es la fidelidad de la aproximación analógica.
                    </p>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider block">
                      Relación Señal/Ruido Pico (PSNR)
                    </span>
                    <h6 className="text-sm font-bold text-zinc-300 font-mono flex items-center gap-1">
                      {stats.mse === 0 ? '∞ DB' : `${stats.psnr.toFixed(2)} dB`}
                    </h6>
                    <p className="text-[10.5px] text-zinc-450 leading-relaxed text-justify">
                      Escala logarítmica de la fidelidad fotográfica. Valores por encima de 30 dB representan una fidelidad casi indistinguible para el ojo humano.
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-6 text-center text-zinc-500 text-xs">
                Calculando información métrica...
              </div>
            )}
          </div>

        </div>

      </main>

      {/* Lab footer credits decoration */}
      <footer className="bg-zinc-950 border-t border-zinc-900 py-6 text-xs text-zinc-550 mt-auto">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 font-sans">
          <div className="space-y-1 text-left">
            <p className="font-semibold text-zinc-400">UTN Facultad Regional La Plata</p>
            <p className="text-zinc-500">Materia: Comunicación de Datos | Laboratorio de Criptografía</p>
            <p className="text-zinc-500">Autores: Lucio Damiani, Juan Sebastián Bajkovec y Agustín Bustamante (G06)</p>
          </div>
          <div className="flex flex-col sm:flex-row md:flex-col items-start md:items-end gap-2 text-[9px] font-mono text-zinc-600">
            <span>HTML5 CANVAS API + TSX</span>
            <span>TASA DE MUESTREO SHANNON-NYQUIST</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
