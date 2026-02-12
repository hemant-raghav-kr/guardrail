import React, { useState } from "react";
import { useSentinelStore } from "../stores/useSentinelStore";
import { toast } from "sonner";
import { ShieldAlert, Activity, Key, Trash2 } from "lucide-react";

const AdminMode = () => {
  const { executePurge, triggerSimulation } = useSentinelStore();
  const [pin, setPin] = useState("");

  const handlePurge = async () => {
    const success = await executePurge(pin);
    if (success) {
      toast.success("SYSTEM PURGE COMPLETE", {
        description: "Supabase logs have been cleared.",
        className: "bg-black border-cyan-500 text-cyan-500 font-mono"
      });
      setPin("");
    } else {
      toast.error("ACCESS DENIED", {
        description: "Invalid Admin PIN.",
        className: "bg-black border-red-500 text-red-500 font-mono"
      });
    }
  };

  const runSimulation = async (type: string) => {
    await triggerSimulation(type);
    toast.info(`SIMULATION: ${type.toUpperCase()}`, {
      description: `Request sent to /${type}`,
      className: "bg-black border-orange-500 text-orange-400 font-mono"
    });
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 font-mono">
      {/* Simulation Triggers (FastAPI Options) */}
      <div className="bg-black/90 border border-white/10 p-4 rounded-xl backdrop-blur-xl shadow-2xl w-72">
        <div className="flex items-center gap-2 mb-3 text-[10px] text-white/40 uppercase tracking-widest font-bold">
          <Activity className="w-3 h-3" /> API_Simulations
        </div>
        <div className="grid grid-cols-1 gap-2">
          <button 
            onClick={() => runSimulation('bot-attack')}
            className="flex items-center justify-between px-3 py-2 bg-orange-500/5 border border-orange-500/20 text-orange-500 rounded text-[10px] uppercase font-bold hover:bg-orange-500 hover:text-white transition-all"
          >
            Trigger Bot Attack <ShieldAlert className="w-3 h-3" />
          </button>
          
          <div className="grid grid-cols-2 gap-2">
            <button 
              onClick={() => runSimulation('login')}
              className="px-3 py-2 bg-cyan-500/5 border border-cyan-500/20 text-cyan-400 rounded text-[10px] uppercase font-bold hover:bg-cyan-500 hover:text-white transition-all"
            >
              Login_Test
            </button>
            <button 
              onClick={() => runSimulation('transfer')}
              className="px-3 py-2 bg-purple-500/5 border border-purple-500/20 text-purple-400 rounded text-[10px] uppercase font-bold hover:bg-purple-500 hover:text-white transition-all"
            >
              Transfer_Test
            </button>
          </div>
        </div>
      </div>

      {/* Admin Authorization & Purge */}
      <div className="bg-black/90 border border-white/10 p-4 rounded-xl backdrop-blur-xl shadow-2xl w-72">
        <div className="flex items-center gap-2 mb-3 text-[10px] text-white/40 uppercase tracking-widest font-bold">
          <Key className="w-3 h-3" /> Admin_Auth
        </div>
        <input 
          type="password"
          placeholder="ENTER PIN"
          value={pin}
          onChange={(e) => setPin(e.target.value)}
          className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-xs text-cyan-400 mb-3 focus:outline-none focus:border-cyan-500/50"
        />
        <button 
          onClick={handlePurge}
          className="w-full flex items-center justify-center gap-2 py-2 bg-red-500/10 border border-red-500/20 text-red-500 rounded text-[10px] uppercase font-bold hover:bg-red-500 hover:text-white transition-all"
        >
          <Trash2 className="w-3 h-3" /> Delete_All_Logs
        </button>
      </div>
    </div>
  );
};

export default AdminMode;