/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface PresetImage {
  id: string;
  name: string;
  category: string;
  description: string;
  // Either provide a procedural draw function, or a source URL to an example image.
  draw?: (ctx: CanvasRenderingContext2D, width: number, height: number) => void;
  src?: string;
}

export interface DigitizeSettings {
  resolutionWidth: number; // Number of horizontal pixels (sampling)
  bitDepth: number; // Bits per pixel (color quantization)
  paletteType: 'standard' | 'grayscale';
  showGrid: boolean;
  zoom: number;
}

export interface PixelData {
  r: number;
  g: number;
  b: number;
  a: number;
}

export interface ProcessedStats {
  originalWidth: number;
  originalHeight: number;
  processedWidth: number;
  processedHeight: number;
  bitsOriginal: number; // bits
  bitsProcessed: number; // bits
  mse: number; // Mean Squared Error
  psnr: number; // Peak Signal-to-Noise Ratio (dB)
}
