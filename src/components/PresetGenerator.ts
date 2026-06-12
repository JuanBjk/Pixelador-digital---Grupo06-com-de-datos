/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { PresetImage } from '../types';

export const PRESETIMAGES: PresetImage[] = [
  {
    id: 'sunset',
    name: 'Atardecer en la Montaña',
    category: 'Gradientes y Siluetas',
    description: 'Ideal para observar el "Banding" (pérdida de suavidad en gradientes) al reducir la profundidad de color.',
    draw: (ctx: CanvasRenderingContext2D, width: number, height: number) => {
      // Background sky gradient
      const skyGrad = ctx.createLinearGradient(0, 0, 0, height * 0.7);
      skyGrad.addColorStop(0, '#110033'); // Dark purple
      skyGrad.addColorStop(0.3, '#3a1c5e'); // Medium purple
      skyGrad.addColorStop(0.6, '#9a3b68'); // Pinkish red
      skyGrad.addColorStop(0.85, '#f37053'); // Deep orange
      skyGrad.addColorStop(1, '#ffc045'); // Golden yellow
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, width, height);

      // The Sun
      const sunX = width * 0.65;
      const sunY = height * 0.55;
      const sunRadius = Math.min(width, height) * 0.16;
      const sunGrad = ctx.createLinearGradient(sunX, sunY - sunRadius, sunX, sunY + sunRadius);
      sunGrad.addColorStop(0, '#ffffcc');
      sunGrad.addColorStop(1, '#ff9900');
      ctx.beginPath();
      ctx.arc(sunX, sunY, sunRadius, 0, Math.PI * 2);
      ctx.fillStyle = sunGrad;
      ctx.shadowColor = '#ff6600';
      ctx.shadowBlur = 40;
      ctx.fill();
      ctx.shadowBlur = 0; // Reset shadow

      // Distant mountains
      ctx.fillStyle = '#211242';
      ctx.beginPath();
      ctx.moveTo(0, height * 0.75);
      // Rough curves
      ctx.quadraticCurveTo(width * 0.25, height * 0.58, width * 0.5, height * 0.72);
      ctx.quadraticCurveTo(width * 0.75, height * 0.65, width, height * 0.8);
      ctx.lineTo(width, height);
      ctx.lineTo(0, height);
      ctx.closePath();
      ctx.fill();

      // Near mountains/lake shore
      ctx.fillStyle = '#0f0724';
      ctx.beginPath();
      ctx.moveTo(0, height * 0.88);
      ctx.bezierCurveTo(width * 0.3, height * 0.78, width * 0.6, height * 0.95, width, height * 0.85);
      ctx.lineTo(width, height);
      ctx.lineTo(0, height);
      ctx.closePath();
      ctx.fill();

      // Reflections on water surface (bottom part is ocean/lake)
      const waterY = height * 0.82;
      ctx.strokeStyle = 'rgba(255, 192, 69, 0.4)';
      ctx.lineWidth = 3;
      for (let y = waterY; y < height; y += 8) {
        const offset = (y - waterY) * 2;
        ctx.beginPath();
        ctx.moveTo(sunX - sunRadius - offset, y);
        ctx.lineTo(sunX + sunRadius + offset, y);
        ctx.stroke();
      }

      // Draw two simple pine trees silhouettes
      ctx.fillStyle = '#0a0319';
      const drawPine = (x: number, y: number, scale: number) => {
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x - 20 * scale, y + 40 * scale);
        ctx.lineTo(x - 10 * scale, y + 40 * scale);
        ctx.lineTo(x - 25 * scale, y + 70 * scale);
        ctx.lineTo(x - 15 * scale, y + 70 * scale);
        ctx.lineTo(x - 30 * scale, y + 100 * scale);
        ctx.lineTo(x + 30 * scale, y + 100 * scale);
        ctx.lineTo(x + 15 * scale, y + 70 * scale);
        ctx.lineTo(x + 25 * scale, y + 70 * scale);
        ctx.lineTo(x + 10 * scale, y + 40 * scale);
        ctx.lineTo(x + 20 * scale, y + 40 * scale);
        ctx.closePath();
        ctx.fill();
        // Trunk
        ctx.fillRect(x - 4 * scale, y + 100 * scale, 8 * scale, 15 * scale);
      };

      drawPine(width * 0.15, height * 0.74, 0.9);
      drawPine(width * 0.82, height * 0.76, 0.7);
    }
  },
  {
    id: 'psychedelic',
    name: 'Patrones Geométricos Retro',
    category: 'Formas de Alto Contraste',
    description: 'Perfecto para ver el aliasing (efecto sierra / bloques pixelados) y la fidelidad de curvas a baja resolución.',
    draw: (ctx: CanvasRenderingContext2D, width: number, height: number) => {
      // Vibrant modern layout
      ctx.fillStyle = '#0f172a'; // Slate-900 background
      ctx.fillRect(0, 0, width, height);

      // Grid background
      ctx.strokeStyle = 'rgba(51, 65, 85, 0.3)';
      ctx.lineWidth = 1;
      const gridSize = 40;
      for (let x = 0; x < width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y < height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // Retro grid/waves in background
      ctx.strokeStyle = '#06b6d4'; // Cyan-500
      ctx.lineWidth = 2;
      ctx.beginPath();
      for (let x = 0; x < width; x += 3) {
        const y = height * 0.5 + Math.sin(x * 0.02) * 50 + Math.cos(x * 0.005) * 30;
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      // Big radial circle pattern
      const radialGrad = ctx.createRadialGradient(
        width * 0.5, height * 0.5, 10,
        width * 0.5, height * 0.5, Math.min(width, height) * 0.4
      );
      radialGrad.addColorStop(0, '#ec4899'); // Fuchsia
      radialGrad.addColorStop(0.5, '#8b5cf6'); // Violet
      radialGrad.addColorStop(1, 'transparent');
      ctx.fillStyle = radialGrad;
      ctx.beginPath();
      ctx.arc(width * 0.5, height * 0.5, Math.min(width, height) * 0.4, 0, Math.PI * 2);
      ctx.fill();

      // Sharp geometric shapes
      // Yellow triangle
      ctx.fillStyle = '#eab308'; // Amber-500
      ctx.beginPath();
      ctx.moveTo(width * 0.2, height * 0.2);
      ctx.lineTo(width * 0.4, height * 0.15);
      ctx.lineTo(width * 0.3, height * 0.5);
      ctx.closePath();
      ctx.fill();

      // Cyan rotating square
      ctx.fillStyle = '#06b6d4'; // Cyan
      ctx.save();
      ctx.translate(width * 0.75, height * 0.3);
      ctx.rotate(Math.PI / 6);
      ctx.fillRect(-45, -45, 90, 90);
      ctx.restore();

      // White/Black circle with segment border
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 8;
      ctx.beginPath();
      ctx.arc(width * 0.25, height * 0.75, 45, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = '#10b981'; // Emerald
      ctx.fill();

      // Red overlapping ring
      ctx.strokeStyle = '#ef4444'; // Red
      ctx.lineWidth = 12;
      ctx.beginPath();
      ctx.arc(width * 0.7, height * 0.72, 60, 0, Math.PI * 1.5);
      ctx.stroke();

      // Soft white light puff
      ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
      ctx.beginPath();
      ctx.arc(width * 0.5, height * 0.5, 20, 0, Math.PI * 2);
      ctx.fill();
    }
  },
  {
    id: 'portrait',
    name: 'Ilustración Pop-Art',
    category: 'Rostro y Contrastes',
    description: 'Permite analizar el impacto de la resolución y de la cuantización del color en rasgos de detalle y reconocimiento.',
    draw: (ctx: CanvasRenderingContext2D, width: number, height: number) => {
      // Pop Art color block background
      ctx.fillStyle = '#f43f5e'; // Pink-500
      ctx.fillRect(0, 0, width, height);

      // Yellow left split
      ctx.fillStyle = '#facc15'; // Yellow-400
      ctx.fillRect(0, 0, width * 0.5, height);

      const cx = width * 0.5;
      const cy = height * 0.5;

      // Stylized retro face shape
      ctx.fillStyle = '#ffedd5'; // Skin tone light
      ctx.beginPath();
      ctx.arc(cx, cy, 110, 0, Math.PI * 2);
      ctx.fill();

      // Neck
      ctx.fillStyle = '#fddfbe'; // Skin tone shadow
      ctx.fillRect(cx - 30, cy + 80, 60, 100);

      // Collar/Shoulders
      ctx.fillStyle = '#3b82f6'; // Blue-500
      ctx.beginPath();
      ctx.moveTo(cx - 120, height);
      ctx.lineTo(cx - 50, cy + 140);
      ctx.lineTo(cx + 50, cy + 140);
      ctx.lineTo(cx + 120, height);
      ctx.closePath();
      ctx.fill();

      // Pop Art Hair (big dramatic circle silhouettes)
      ctx.fillStyle = '#1e1b4b'; // Dark indigo hair
      
      // Left puff
      ctx.beginPath();
      ctx.arc(cx - 95, cy - 60, 75, 0, Math.PI * 2);
      ctx.fill();

      // Right puff
      ctx.beginPath();
      ctx.arc(cx + 95, cy - 60, 75, 0, Math.PI * 2);
      ctx.fill();

      // Top puff
      ctx.beginPath();
      ctx.arc(cx, cy - 110, 85, 0, Math.PI * 2);
      ctx.fill();

      // Sunglasses
      // Frame body
      ctx.fillStyle = '#000000';
      ctx.fillRect(cx - 90, cy - 25, 180, 45);
      
      // Lens Left
      ctx.fillStyle = '#10b981'; // Vivid green
      ctx.fillRect(cx - 75, cy - 15, 60, 25);
      // Shine line
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(cx - 65, cy - 10);
      ctx.lineTo(cx - 45, cy + 5);
      ctx.stroke();

      // Lens Right
      ctx.fillStyle = '#10b981'; // Vivid green
      ctx.fillRect(cx + 15, cy - 15, 60, 25);
      // Shine line
      ctx.beginPath();
      ctx.moveTo(cx + 25, cy - 10);
      ctx.lineTo(cx + 45, cy + 5);
      ctx.stroke();

      // Bridge
      ctx.fillStyle = '#000000';
      ctx.fillRect(cx - 15, cy - 15, 30, 10);

      // Lips
      ctx.fillStyle = '#ef4444'; // Red-500 lips
      ctx.beginPath();
      ctx.arc(cx, cy + 45, 20, 0, Math.PI);
      ctx.closePath();
      ctx.fill();
      
      // Lip split
      ctx.fillStyle = '#b91c1c';
      ctx.fillRect(cx - 20, cy + 43, 40, 3);

      // Earrings (Circles)
      ctx.strokeStyle = '#f59e0b'; // Amber gold
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.arc(cx - 110, cy + 40, 25, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(cx + 110, cy + 40, 25, 0, Math.PI * 2);
      ctx.stroke();
    }
  }
];
