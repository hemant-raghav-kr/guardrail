import { useEffect } from "react";
import { useSentinelStore } from "@/stores/useSentinelStore";
import HeroSection from "@/components/HeroSection";
import GlobalMetrics from "@/components/GlobalMetrics";
import DataStreamSection from "@/components/DataStreamSection";
import ThreatLevel from "@/components/ThreatLevel";
import RpsGraph from "@/components/RpsGraph";
import ThreatFeed from "@/components/ThreatFeed";
import BlockedClients from "@/components/BlockedClients";
import LiveEvents from "@/components/LiveEvents";
import AdminMode from "@/components/AdminMode";
import LightStreaks from "@/components/LightStreaks";

const Index = () => {
  const tick = useSentinelStore((s) => s.tick);

  // Global simulation tick
  useEffect(() => {
    const interval = setInterval(tick, 1500);
    return () => clearInterval(interval);
  }, [tick]);

  return (
    <div className="relative bg-background min-h-screen grain scanline">
      <LightStreaks />

      <HeroSection />
      <GlobalMetrics />
      <DataStreamSection />
      <ThreatLevel />
      <RpsGraph />
      <ThreatFeed />
      <BlockedClients />
      <LiveEvents />
      <AdminMode />

      {/* Footer pulse */}
      <div className="py-16 text-center">
        <p className="text-[10px] tracking-[0.5em] uppercase text-muted-foreground/40">
          SYSTEM.ACTIVE — ALL VECTORS MONITORED
        </p>
      </div>
    </div>
  );
};

export default Index;
