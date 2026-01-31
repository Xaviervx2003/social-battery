import React, { useRef, useState } from "react";

export default function BatterySlider({ batteryLevel, onChange }) {
  const sliderRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);

  const updateBatteryFromPointer = (e) => {
    if (!sliderRef.current) return;
    const rect = sliderRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = Math.min(Math.max((x / rect.width) * 100, 0), 100);
    onChange(Math.round(percentage));
  };

  const handlePointerDown = (e) => {
    setIsDragging(true);
    e.currentTarget.setPointerCapture(e.pointerId);
    updateBatteryFromPointer(e);
  };

  const handlePointerMove = (e) => {
    if (isDragging) updateBatteryFromPointer(e);
  };

  const handlePointerUp = (e) => {
    setIsDragging(false);
    e.currentTarget.releasePointerCapture(e.pointerId);
  };

  return (
    <div
      ref={sliderRef}
      className="relative w-full h-14 bg-black/20 rounded-full p-1 mb-2 cursor-pointer touch-none select-none"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
    >
      <div className="w-full h-full rounded-full overflow-hidden relative">
        <div
          className={`h-full bg-white/90 rounded-full relative shadow-sm ${isDragging ? "" : "transition-all duration-300 ease-out"}`}
          style={{ width: `${batteryLevel}%` }}
        >
          <div className="absolute right-1 top-1/2 -translate-y-1/2 w-11 h-11 bg-white rounded-full shadow-md flex items-center justify-center transform active:scale-95 transition-transform">
            <div className="w-1.5 h-4 bg-slate-300 rounded-full"></div>
          </div>
        </div>
      </div>
    </div>
  );
}
