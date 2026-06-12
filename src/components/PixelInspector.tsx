/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useEffect, useState } from 'react';
import { Eye, Info, Crosshair, HelpCircle } from 'lucide-react';

interface PixelInspectorProps {
  originalCanvasRef: React.RefObject<HTMLCanvasElement | null>;
  processedCanvasRef: React.RefObject<HTMLCanvasElement | null>;
  sampledWidth: number;
  sampledHeight: number;
  hoverCoords: { x: number; y: number } | null;
  displayDimensions: { width: number; height: number };
}

export default function PixelInspector({
  originalCanvasRef,
  processedCanvasRef,
  sampledWidth,
  sampledHeight,
  hoverCoords,
  displayDimensions,
}: PixelInspectorProps) {
  const [pixelInfo, setPixelInfo] = useState<{
    x: number;
    y: number;
    origR: number;
    origG: number;
    origB: number;
    origHex: string;
    procR: number;
    procG: number;
    procB: number;
    procHex: string;
    gridRgbMatrix: Array<Array<{ orig: string; proc: string }>>;
  } | null>(null);

  const rgbToHex = (r: number, g: number, b: number) => {
    return '#' + [r, g, b].map(x => {
      const hex = x.toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    }).join('');
  };

  useEffect(() => {
    if (!hoverCoords) {
      setPixelInfo(null);
      return;
    }

    const origCanvas = originalCanvasRef.current;
    const procCanvas = processedCanvasRef.current;
    if (!origCanvas || !procCanvas) return;

    const origCtx = origCanvas.getContext('2d', { willReadFrequently: true });
    const procCtx = procCanvas.getContext('2d', { willReadFrequently: true });
    if (!origCtx || !procCtx) return;

    // Relative floating position 0.0 to 1.0 inside the displayed image
    const rx = hoverCoords.x / displayDimensions.width;
    const ry = hoverCoords.y / displayDimensions.height;

    // Map to actual pixel coordinates in original image
    const ow = origCanvas.width;
    const oh = origCanvas.height;
    const ox = Math.min(ow - 1, Math.max(0, Math.floor(rx * ow)));
    const oy = Math.min(oh - 1, Math.max(0, Math.floor(ry * oh)));

    // Map to actual pixel coordinates in processed image
    const pw = procCanvas.width;
    const ph = procCanvas.height;
    const px = Math.min(pw - 1, Math.max(0, Math.floor(rx * pw)));
    const py = Math.min(ph - 1, Math.max(0, Math.floor(ry * ph)));

    try {
      // Get exact RGB of hovered pixel from original
      const origPixel = origCtx.getImageData(ox, oy, 1, 1).data;
      
      // Get exact RGB of hovered pixel from processed
      const procPixel = procCtx.getImageData(px, py, 1, 1).data;

      // Build a 5x5 grid matrix around the hovered pixel in the processed image for visual magnified preview
      const matrixSize = 5;
      const radius = Math.floor(matrixSize / 2);
      const gridRgbMatrix: Array<Array<{ orig: string; proc: string }>> = [];

      for (let dy = -radius; dy <= radius; dy++) {
        const row: Array<{ orig: string; proc: string }> = [];
        for (let dx = -radius; dx <= radius; dx++) {
          // Surrounding coordinates in processed
          const spx = Math.min(pw - 1, Math.max(0, px + dx));
          const spy = Math.min(ph - 1, Math.max(0, py + dy));
          const sProcPixel = procCtx.getImageData(spx, spy, 1, 1).data;
          const sProcHex = rgbToHex(sProcPixel[0], sProcPixel[1], sProcPixel[2]);

          // Math mapping for original surrounding pixels to understand scale
          const sox = Math.min(ow - 1, Math.max(0, Math.floor((spx + 0.5) / pw * ow)));
          const soy = Math.min(oh - 1, Math.max(0, Math.floor((spy + 0.5) / ph * oh)));
          const sOrigPixel = origCtx.getImageData(sox, soy, 1, 1).data;
          const sOrigHex = rgbToHex(sOrigPixel[0], sOrigPixel[1], sOrigPixel[2]);

          row.push({ orig: sOrigHex, proc: sProcHex });
        }
        gridRgbMatrix.push(row);
      }

      setPixelInfo({
        x: px,
        y: py,
        origR: origPixel[0],
        origG: origPixel[1],
        origB: origPixel[2],
        origHex: rgbToHex(origPixel[0], origPixel[1], origPixel[2]),
        procR: procPixel[0],
        procG: procPixel[1],
        procB: procPixel[2],
        procHex: rgbToHex(procPixel[0], procPixel[1], procPixel[2]),
        gridRgbMatrix,
      });
    } catch (e) {
      console.warn("Failed to read image pixel details: CORS or empty buffer", e);
    }
  }, [hoverCoords, displayDimensions, sampledWidth, sampledHeight, originalCanvasRef, processedCanvasRef]);

  return (
    <div id="inspector-card" className="bg-white dark:bg-slate-900 border border-slate-205/60 dark:border-slate-800/85 rounded-2xl p-5.5 shadow-[0_2px_8px_rgba(15,23,42,0.01)] transition-all">
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/60 pb-3 mb-4">
        <div className="flex items-center gap-2">
          <Eye size={18} className="text-indigo-600 dark:text-indigo-400" />
          <h3 className="font-extrabold text-[#111827] dark:text-slate-100 text-xs tracking-widest uppercase">
            Inspector de Píxeles Interactivo
          </h3>
        </div>
        <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-400 border border-indigo-100/50 dark:border-indigo-900/10">
          En Tiempo Real
        </span>
      </div>

      {!pixelInfo ? (
        <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
          <Crosshair size={32} className="text-slate-300 dark:text-slate-650 mb-3 animate-pulse" />
          <p className="text-xs text-slate-700 dark:text-slate-300 font-extrabold uppercase tracking-wide">
            EXPLORACIÓN EN LÍNEA
          </p>
          <p className="text-[11px] text-slate-450 dark:text-slate-500 mt-1 max-w-xs leading-relaxed">
            Pasa el cursor sobre la pantalla o mantén presionado para examinar las coordenadas, el nivel cromático y la desviación matemática de Nyquist.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 items-stretch">
          {/* Magnified Lense View */}
          <div className="flex flex-col items-center justify-center border border-slate-150 dark:border-slate-800 bg-[#f8fafc]/50 dark:bg-slate-950/40 p-4 rounded-xl shadow-inner">
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-1 font-sans">
              Lente de Aumento (Matriz 5x5)
            </span>
            
            {/* 5x5 Magnified Grid */}
            <div className="grid grid-cols-5 gap-1 p-1.5 bg-slate-100 dark:bg-slate-900 rounded-xl">
              {pixelInfo.gridRgbMatrix.map((row, rIdx) =>
                row.map((cell, cIdx) => {
                  const isCenter = rIdx === 2 && cIdx === 2;
                  return (
                    <div
                      key={`${rIdx}-${cIdx}`}
                      className="relative w-8.5 h-8.5 rounded-md transition-transform duration-200"
                      style={{ backgroundColor: cell.proc }}
                      title={`Original: ${cell.orig}\nProcesado: ${cell.proc}`}
                    >
                      {isCenter && (
                        <div className="absolute inset-0 border-2 border-red-550 animate-pulse rounded-md flex items-center justify-center">
                          <div className="w-1.5 h-1.5 bg-red-555 rounded-full"></div>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
            
            <div className="text-[10px] text-slate-450 dark:text-slate-500 mt-3 flex items-center gap-1.5 text-center font-mono font-bold">
              <Info size={11} className="text-slate-400" /> Coordenada de Muestreo: {pixelInfo.x}x, {pixelInfo.y}y
            </div>
          </div>

          {/* Color stats comparison */}
          <div className="flex flex-col justify-between gap-3">
            {/* Original Color Display */}
            <div className="flex items-center gap-3 p-2.5 border border-slate-200/50 dark:border-slate-800/80 bg-white dark:bg-slate-900/40 rounded-xl">
              <div
                className="w-12 h-12 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 shrink-0"
                style={{ backgroundColor: pixelInfo.origHex }}
              ></div>
              <div className="flex-1 min-w-0">
                <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                  Color Original
                </span>
                <h4 className="text-xs font-bold text-slate-850 dark:text-slate-200 truncate font-mono">
                  {pixelInfo.origHex.toUpperCase()}
                </h4>
                <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 font-mono">
                  RGB({pixelInfo.origR}, {pixelInfo.origG}, {pixelInfo.origB})
                </p>
              </div>
            </div>

            {/* Downward flow arrow */}
            <div className="flex justify-center -my-1.5">
              <div className="w-5.5 h-5.5 rounded-full bg-indigo-50 dark:bg-indigo-950/80 border border-indigo-100 dark:border-indigo-900/40 flex items-center justify-center text-indigo-600 dark:text-indigo-400 text-[10px] font-bold font-mono">
                ↓
              </div>
            </div>

            {/* Digitized Color Display */}
            <div className="flex items-center gap-3 p-2.5 border border-slate-200/50 dark:border-slate-800/80 bg-white dark:bg-slate-900/40 rounded-xl">
              <div
                className="w-12 h-12 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 shrink-0"
                style={{ backgroundColor: pixelInfo.procHex }}
              ></div>
              <div className="flex-1 min-w-0">
                <span className="text-[9px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider flex items-center gap-1">
                  Color Digitalizado
                </span>
                <h4 className="text-xs font-bold text-slate-850 dark:text-slate-100 truncate font-mono">
                  {pixelInfo.procHex.toUpperCase()}
                </h4>
                <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 font-mono">
                  RGB({pixelInfo.procR}, {pixelInfo.procG}, {pixelInfo.procB})
                </p>
              </div>
            </div>

            {/* Theoretical Loss Description */}
            <div className="text-[11px] bg-slate-50 dark:bg-slate-900/60 p-2.5 rounded-xl border border-slate-150 dark:border-slate-800 leading-relaxed">
              <span className="font-bold text-slate-700 dark:text-slate-300">Cuantización local: </span>
              {pixelInfo.origHex === pixelInfo.procHex ? (
                <span className="text-emerald-600 dark:text-emerald-405 font-bold">Sin pérdidas (fidelidad máxima).</span>
              ) : (
                <span className="text-slate-500 dark:text-slate-450 font-medium">
                  Error de redondeo de amplitud de color ΔRGB = ({Math.abs(pixelInfo.origR - pixelInfo.procR)}, {Math.abs(pixelInfo.origG - pixelInfo.procG)}, {Math.abs(pixelInfo.origB - pixelInfo.procB)}).
                </span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
