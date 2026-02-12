import { useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useSentinelStore } from "./stores/useSentinelStore";

import ParticleCanvas from "./components/ParticleCanvas";
import LightStreaks from "./components/LightStreaks";
import GlobalMetrics from "./components/GlobalMetrics";
import DataStreamSection from "./components/DataStreamSection";
import RpsGraph from "./components/RpsGraph";
import BlockedClients from "./components/BlockedClients";
import LiveEvents from "./components/LiveEvents";
import AdminMode from "./components/AdminMode";

import { TooltipProvider } from "./components/ui/tooltip";
import { Toaster } from "./components/ui/sonner";

const queryClient = new QueryClient();

// Security Badge
const SecurityBadge = ({ score }: { score: number }) => {
  const getGrade = () => {
    if (score > 80) return { l: "F", c: "text-red-500", b: "border-red-500/30 bg-red-500/5" };
    if (score > 50) return { l: "C", c: "text-orange-500", b: "border-orange-500/30 bg-orange-500/5" };
    return { l: "A", c: "text-cyan-400", b: "border-cyan-500/30 bg-cyan-500/5" };
  };
  const grade = getGrade();

  return (
    <div className={`flex flex-col items-end justify-center px-4 py-1 rounded-lg border ${grade.b} min-w-[100px]`}>
      <span className="text-[8px] uppercase font-bold tracking-widest opacity-50">Security_Grade</span>
      <span className={`text-3xl font-black ${grade.c}`}>{grade.l}</span>
    </div>
  );
};

const DashboardContent = () => {
  const tick = useSentinelStore((s) => s.tick);
  const isAdminTyping = useSentinelStore((s) => s.isAdminTyping);
  const threatScore = useSentinelStore((s) => s.threatScore);

  useEffect(() => {
    if (isAdminTyping) return;

    const interval = setInterval(() => tick(), 3000);
    return () => clearInterval(interval);
  }, [tick, isAdminTyping]);

  return (
    <div className="relative min-h-screen bg-black text-white overflow-hidden font-mono selection:bg-cyan-500/30">
      <ParticleCanvas />
      <LightStreaks />

      <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden opacity-10">
        <div className="h-[1px] w-full bg-cyan-500 shadow-[0_0_10px_rgba(6,182,212,1)] animate-scanline" />
      </div>

      <div className="relative z-10 flex flex-col min-h-screen">
        <header className="border-b border-white/10 bg-black/60 backdrop-blur-md sticky top-0 z-50 px-6 py-2">
          <div className="max-w-[1920px] mx-auto flex justify-between items-center h-16">
            <GlobalMetrics />
            <SecurityBadge score={threatScore} />
          </div>
        </header>

        <main className="flex-1 p-6 space-y-8 max-w-[1920px] mx-auto w-full">
          <section className="min-h-[35vh] flex flex-col items-center justify-center">
            <DataStreamSection />
          </section>

          <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 h-[350px] bg-black/40 border border-white/10 rounded-xl p-4 backdrop-blur-sm">
              <RpsGraph />
            </div>
            <div className="h-[350px] bg-black/40 border border-white/10 rounded-xl p-4 backdrop-blur-sm overflow-hidden">
              <LiveEvents />
            </div>
          </section>

          <section className="h-[350px] bg-black/40 border border-white/10 rounded-xl p-4 backdrop-blur-sm overflow-hidden mb-20">
            <BlockedClients />
          </section>
        </main>
      </div>

      <AdminMode />
    </div>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster theme="dark" position="top-center" />
      <DashboardContent />
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;