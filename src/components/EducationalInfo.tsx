/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Save } from 'lucide-react';

export default function EducationalInfo() {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-5">
      <div className="space-y-4">
        <h4 className="text-xs font-bold text-zinc-100 flex items-center gap-2 uppercase tracking-wider">
          <Save size={14} className="text-zinc-400" />
          Fórmula de cálculo del tamaño de archivo
        </h4>
        <p className="text-xs text-zinc-400 leading-relaxed">
          El tamaño binario total de una imagen digital cruda (Bitmap sin compresión) se calcula mediante una multiplicación lineal directa:
        </p>
        <div className="p-3 bg-zinc-950 border border-zinc-800 rounded-lg text-center">
          <code className="text-[12px] font-bold text-zinc-200 font-mono block">
            Tamaño (bits) = Ancho × Alto × Prf_Bits
          </code>
          <code className="text-[10px] font-mono text-zinc-500 block mt-1">
            Bytes = Bits / 8 | Kilobytes (KB) = Bytes / 1024
          </code>
        </div>
        <p className="text-xs text-zinc-400 leading-relaxed">
          Por ejemplo, una imagen clásica Full HD de 1920 × 1080 con profundidad de 24 bits (RGB estándar de 8 bits por canal) consume en memoria RAM:
        </p>
        <div className="text-[10.5px] font-mono text-zinc-450 pl-4 space-y-1 border-l-2 border-zinc-700">
          <p>• Píxeles totales = 1920 × 1080 = 2,073,600 píxeles</p>
          <p>• Bits = 2,073,600 × 24 bits = 49,766,400 bits</p>
          <p>• Bytes = 49,766,400 / 8 = 6,220,800 Bytes</p>
          <p>• Kilobytes = 6,220,800 / 1024 = 6,075 KB</p>
          <p>• Megabytes = 6,075 / 1024 ≈ <strong>5.93 MB</strong></p>
        </div>
      </div>
    </div>
  );
}
