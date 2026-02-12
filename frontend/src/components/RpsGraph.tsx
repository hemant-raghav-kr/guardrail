import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useSentinelStore } from "@/stores/useSentinelStore";

const RpsGraph = () => {
  const { rpsHistory } = useSentinelStore();

  // FIX: Convert simple numbers to objects for Recharts
  const chartData = rpsHistory.map((val, i) => ({
    time: i,
    value: val
  }));

  return (
    <div className="w-full h-full flex flex-col">
      <h3 className="text-xs font-bold text-white/40 tracking-widest uppercase mb-4">
        Network_Traffic (RPS)
      </h3>
      <div className="flex-1 min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="colorRps" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#22d3ee" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis hide />
            <YAxis hide domain={[0, 'auto']} />
            <Tooltip 
              contentStyle={{ backgroundColor: '#000', border: '1px solid #333' }}
              itemStyle={{ color: '#22d3ee' }}
              labelStyle={{ display: 'none' }}
            />
            <Area 
              type="monotone" 
              dataKey="value" 
              stroke="#22d3ee" 
              strokeWidth={2}
              fillOpacity={1} 
              fill="url(#colorRps)" 
              isAnimationActive={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default RpsGraph;