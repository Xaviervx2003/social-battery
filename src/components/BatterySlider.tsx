import React, { useRef, useState } from "react";
import { Zap } from "lucide-react";

// 1. Definimos o que o componente aceita (Props)
interface BatterySliderProps {
  batteryLevel: number;
  onChange: (newLevel: number) => void;
}

export default function BatterySlider({
  batteryLevel,
  onChange,
}: BatterySliderProps) {
  // 2. Tipamos o Ref para saber que é uma DIV HTML
  const sliderRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const calculatePercentage = (clientX: number) => {
    if (!sliderRef.current) return 0;
    const rect = sliderRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    // Garante entre 0 e 100
    return Math.min(Math.max((x / rect.width) * 100, 0), 100);
  };

  // 3. Tipamos os eventos (PointerEvent para mouse/touch)
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    setIsDragging(true);
    e.currentTarget.setPointerCapture(e.pointerId);
    onChange(Math.round(calculatePercentage(e.clientX)));
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isDragging) {
      e.preventDefault();
      onChange(Math.round(calculatePercentage(e.clientX)));
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    setIsDragging(false);
    e.currentTarget.releasePointerCapture(e.pointerId);
  };

  // 4. Tipamos evento de teclado
  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "ArrowRight" || e.key === "ArrowUp") {
      e.preventDefault();
      onChange(Math.min(batteryLevel + 5, 100));
    }
    if (e.key === "ArrowLeft" || e.key === "ArrowDown") {
      e.preventDefault();
      onChange(Math.max(batteryLevel - 5, 0));
    }
  };

  return (
    <div className="w-full mb-6 px-1">
      <label htmlFor="energy-slider" className="sr-only">
        Nível de Bateria Social
      </label>

      <div
        id="energy-slider"
        ref={sliderRef}
        role="slider"
        tabIndex={0}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={batteryLevel}
        aria-label="Controle de Energia Social"
        onKeyDown={handleKeyDown}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        className={`
          relative w-full h-14 bg-black/20 rounded-full p-1 cursor-pointer touch-none select-none 
          outline-none ring-offset-2 focus:ring-2 focus:ring-blue-400 transition-shadow
        `}
      >
        {/* Background do slider */}
        <div className="w-full h-full rounded-full overflow-hidden relative bg-white/5">
          {/* Barra de Progresso */}
          <div
            className={`h-full bg-white/90 rounded-full relative shadow-[0_0_15px_rgba(255,255,255,0.5)] 
              ${isDragging ? "transition-none" : "transition-all duration-500 ease-out"}
            `}
            style={{ width: `${batteryLevel}%` }}
          >
            {/* O "Thumb" (Bolinha) */}
            <div className="absolute right-1 top-1/2 -translate-y-1/2 w-11 h-11 bg-white rounded-full shadow-lg flex items-center justify-center transform active:scale-95 transition-transform">
              {batteryLevel > 20 ? (
                <Zap
                  size={20}
                  className={
                    batteryLevel > 50 ? "text-green-500" : "text-yellow-500"
                  }
                  fill="currentColor"
                />
              ) : (
                <div className="w-1.5 h-4 bg-slate-300 rounded-full" />
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-between text-xs text-white/50 font-medium mt-2 px-2">
        <span>0%</span>
        <span>Arraste ou use as setas</span>
        <span>100%</span>
      </div>
    </div>
  );
}
