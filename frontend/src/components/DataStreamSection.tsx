import React from "react";
import { useSentinelStore } from "../stores/useSentinelStore";

const DataStreamSection = () => {
  const { threatScore, currentRps } = useSentinelStore();
  
  const isHighThreat = threatScore > 75;

  return (
    <div className="text-center space-y-4 animate-fade-in">
      <div className={`inline-block px-3 py-1 border ${isHighThreat ? 'border-red-500 text-red-500' : 'border-cyan-500/50 text-cyan-400'} rounded-full text-[10px] uppercase tracking-[0.2em] mb-4`}>
        {isHighThreat ? 'CRITICAL_ANOMALY_DETECTED' : 'SYSTEM_STATUS: NOMINAL'}
      </div>
      
      <h1 className={`text-6xl md:text-8xl font-black tracking-tighter ${isHighThreat ? 'text-red-600' : 'text-white'}`}>
        {threatScore}%
      </h1>
      
      <p className="text-white/40 text-xs uppercase tracking-widest max-w-md mx-auto">
        Current calculated network threat probability based on <span className="text-cyan-400">{currentRps} RPS</span> ingress traffic stream.
      </p>

      {isHighThreat && (
        <div className="mt-8 animate-pulse text-red-500 text-xs font-bold border-y border-red-500/20 py-2">
          AUTOMATIC_RATE_LIMITING_ENGAGED
        </div>
      )}
    </div>
  );
};

export default DataStreamSection;