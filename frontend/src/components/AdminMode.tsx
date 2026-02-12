import React, { useState } from "react";
import { useSentinelStore } from "../stores/useSentinelStore";
import { toast } from "sonner";
import { ShieldAlert, Activity, Key, Trash2, Loader2 } from "lucide-react";

const AdminMode = () => {
  const { 
    executePurge, 
    triggerBotAttack, 
    loading, 
    error,
    setAdminTyping // 👈 NEW
  } = useSentinelStore();

  const [pin, setPin] = useState("");
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const handlePurge = async () => {
    if (!pin.trim()) {
      toast.error("PIN REQUIRED", {
        description: "Please enter your admin PIN.",
        className: "bg-black border-red-500 text-red-500 font-mono"
      });
      return;
    }
    
    setActionLoading("purge");
    const success = await executePurge(pin);
    setActionLoading(null);
    
    if (success) {
      toast.success("SYSTEM PURGE COMPLETE", {
        description: "All logs have been cleared.",
        className: "bg-black border-cyan-500 text-cyan-500 font-mono"
      });
      setPin("");
    } else {
      toast.error("ACCESS DENIED", {
        description: "Invalid Admin PIN or deletion failed.",
        className: "bg-black border-red-500 text-red-500 font-mono"
      });
    }
  };

  const handleBotAttack = async () => {
    setActionLoading("bot");
    const success = await triggerBotAttack();
    setActionLoading(null);
    
    if (success) {
      toast.info("BOT ATTACK SIMULATION TRIGGERED", {
        description: "Malicious traffic simulation started.",
        className: "bg-black border-orange-500 text-orange-400 font-mono"
      });
    } else {
      toast.error("SIMULATION FAILED", {
        description: "Could not trigger bot attack simulation.",
        className: "bg-black border-red-500 text-red-500 font-mono"
      });
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 font-mono">
      {/* Error Display */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 p-3 rounded-xl backdrop-blur-xl shadow-2xl w-72">
          <div className="text-[10px] text-red-500 uppercase font-bold">Error</div>
          <div className="text-[9px] text-red-400 mt-1">{error}</div>
        </div>
      )}

      {/* Simulation Controls */}
      <div className="bg-black/90 border border-white/10 p-4 rounded-xl backdrop-blur-xl shadow-2xl w-72">
        <div className="flex items-center gap-2 mb-3 text-[10px] text-white/40 uppercase tracking-widest font-bold">
          <Activity className="w-3 h-3" /> API_Simulations
        </div>
        <button 
          onClick={handleBotAttack}
          disabled={actionLoading === "bot" || loading}
          className="flex items-center justify-between px-3 py-2 bg-orange-500/5 border border-orange-500/20 text-orange-500 rounded text-[10px] uppercase font-bold hover:bg-orange-500 hover:text-white transition-all disabled:opacity-50"
        >
          {actionLoading === "bot" ? (
            <>Triggering... <Loader2 className="w-3 h-3 animate-spin" /></>
          ) : (
            <>Trigger Bot Attack <ShieldAlert className="w-3 h-3" /></>
          )}
        </button>
      </div>

      {/* Admin Authorization */}
      <div className="bg-black/90 border border-white/10 p-4 rounded-xl backdrop-blur-xl shadow-2xl w-72">
        <div className="flex items-center gap-2 mb-3 text-[10px] text-white/40 uppercase tracking-widest font-bold">
          <Key className="w-3 h-3" /> Admin_Auth
        </div>

        <input 
          type="password"
          placeholder="ENTER PIN"
          value={pin}
          onChange={(e) => setPin(e.target.value)}
          onFocus={() => setAdminTyping(true)}   // 👈 PAUSE REFRESH
          onBlur={() => setAdminTyping(false)}   // 👈 RESUME REFRESH
          disabled={actionLoading === "purge" || loading}
          className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-xs text-cyan-400 mb-3 focus:outline-none focus:border-cyan-500/50 disabled:opacity-50"
        />

        <button 
          onClick={handlePurge}
          disabled={actionLoading === "purge" || loading}
          className="w-full flex items-center justify-center gap-2 py-2 bg-red-500/10 border border-red-500/20 text-red-500 rounded text-[10px] uppercase font-bold hover:bg-red-500 hover:text-white transition-all disabled:opacity-50"
        >
          {actionLoading === "purge" ? (
            <><Loader2 className="w-3 h-3 animate-spin" /> Purging...</>
          ) : (
            <><Trash2 className="w-3 h-3" /> Delete_All_Logs</>
          )}
        </button>
      </div>
    </div>
  );
};

export default AdminMode;