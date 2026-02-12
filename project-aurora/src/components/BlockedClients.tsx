import React from "react";
import { useSentinelStore } from "../stores/useSentinelStore";
import { ShieldAlert, Globe, Clock } from "lucide-react";

const BlockedClients = () => {
  const { blockedClients } = useSentinelStore();

  return (
    <div className="w-full h-full flex flex-col font-mono">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xs font-bold text-white/40 tracking-widest uppercase flex items-center gap-2">
          <ShieldAlert className="w-3 h-3 text-red-500" />
          Blocked_Client_Database
        </h3>
        <span className="text-[10px] text-cyan-500/50">LIVE_SYNC_ACTIVE</span>
      </div>

      <div className="flex-1 overflow-auto custom-scrollbar">
        <table className="w-full text-left border-collapse">
          <thead className="sticky top-0 bg-black/80 backdrop-blur-sm border-b border-white/10 text-[10px] text-white/40 uppercase">
            <tr>
              <th className="py-2 px-4">Timestamp</th>
              <th className="py-2 px-4">Client_IP</th>
              <th className="py-2 px-4">Threat_Score</th>
              <th className="py-2 px-4">Reason</th>
              <th className="py-2 px-4">Endpoint</th>
            </tr>
          </thead>
          <tbody className="text-[11px]">
            {blockedClients.map((client) => (
              <tr key={client.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                <td className="py-3 px-4 text-white/60 flex items-center gap-2">
                  <Clock className="w-3 h-3" /> {client.timestamp}
                </td>
                <td className="py-3 px-4 font-bold text-cyan-400">
                   <div className="flex items-center gap-2">
                     <Globe className="w-3 h-3 opacity-50" /> {client.clientIp}
                   </div>
                </td>
                <td className="py-3 px-4">
                  <span className={`px-2 py-0.5 rounded ${client.threatScore > 80 ? 'bg-red-500/20 text-red-500' : 'bg-yellow-500/20 text-yellow-500'}`}>
                    {client.threatScore}%
                  </span>
                </td>
                <td className="py-3 px-4 text-white/40 italic">{client.reason}</td>
                <td className="py-3 px-4 text-cyan-500/70">{client.endpoint}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {blockedClients.length === 0 && (
          <div className="h-full flex items-center justify-center text-white/20 text-xs italic">
            No active blocks detected. System clear.
          </div>
        )}
      </div>
    </div>
  );
};

export default BlockedClients;