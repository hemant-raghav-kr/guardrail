import React from "react";
import { useSentinelStore } from "../stores/useSentinelStore";

const GlobalMetrics = () => {
  const { threatScore, environment, detectionType, totalRequests, totalBlocked, activeConnections, currentRps, peakRps } = useSentinelStore();

  return (
    <div className="flex items-center justify-between px-6 py-4 w-full font-mono bg-black/40 backdrop-blur-md border-b border-white/10">
      {/* Feature from original: Environment & Logic Info */}
      <div className="flex gap-8 border-r border-white/10 pr-8">
        <div>
          <p className="text-[10px] text-white/30 uppercase tracking-tighter">Env</p>
          <p className="text-[11px] text-cyan-400 font-bold">{environment}</p>
        </div>
        <div>
          <p className="text-[10px] text-white/30 uppercase tracking-tighter">Logic</p>
          <p className="text-[11px] text-white/70">{detectionType}</p>
        </div>
      </div>

      {/* Your Current Stats Grid */}
      <div className="flex flex-1 justify-around px-4">
        <div className="text-center">
          <p className="text-[10px] text-white/30 uppercase">Total Req</p>
          <p className="text-xs font-bold">{totalRequests}</p>
        </div>
        <div className="text-center">
          <p className="text-[10px] text-white/30 uppercase">Blocked</p>
          <p className="text-xs font-bold text-red-500">{totalBlocked}</p>
        </div>
        <div className="text-center">
          <p className="text-[10px] text-white/30 uppercase">Active</p>
          <p className="text-xs font-bold">{activeConnections}</p>
        </div>
        <div className="text-center">
          <p className="text-[10px] text-white/30 uppercase">RPS</p>
          <p className="text-xs font-bold text-cyan-400">{currentRps}</p>
        </div>
      </div>

      {/* Feature from original: Threat Level Label */}
      <div className="flex items-center gap-4 border-l border-white/10 pl-8">
        <div className="text-right">
          <p className="text-[10px] text-white/30 uppercase">Threat Level</p>
          <p className={`text-[11px] font-bold ${threatScore > 50 ? 'text-red-500' : 'text-emerald-500'}`}>
            {threatScore > 50 ? 'HIGH: API Abuse' : 'LOW: Normal Traffic'}
          </p>
        </div>
        <div className={`w-2 h-2 rounded-full animate-pulse ${threatScore > 50 ? 'bg-red-500 shadow-[0_0_8px_red]' : 'bg-emerald-500 shadow-[0_0_8px_emerald]'}`} />
      </div>
    </div>
  );
};

export default GlobalMetrics;