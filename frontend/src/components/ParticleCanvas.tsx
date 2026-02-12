import { useEffect, useRef } from "react";

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  isAnomaly: boolean;
  size: number;
}

const ParticleCanvas = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const animFrameRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const spawnParticle = (): Particle => {
      const isAnomaly = Math.random() < 0.08;
      return {
        x: -10,
        y: Math.random() * canvas.height,
        vx: 1 + Math.random() * 3,
        vy: (Math.random() - 0.5) * 0.8,
        life: 0,
        maxLife: 200 + Math.random() * 300,
        isAnomaly,
        size: isAnomaly ? 2 + Math.random() * 2 : 1 + Math.random(),
      };
    };

    for (let i = 0; i < 120; i++) {
      const p = spawnParticle();
      p.x = Math.random() * canvas.width;
      particlesRef.current.push(p);
    }

    const animate = () => {
      ctx.fillStyle = "rgba(8, 8, 8, 0.15)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      if (Math.random() < 0.3) {
        particlesRef.current.push(spawnParticle());
      }

      particlesRef.current = particlesRef.current.filter((p) => {
        p.x += p.vx;
        p.y += p.vy;
        p.life++;
        p.vy += (Math.random() - 0.5) * 0.1;

        const alpha = Math.min(1, (1 - p.life / p.maxLife) * 1.5);

        if (p.isAnomaly) {
          ctx.shadowBlur = 12;
          ctx.shadowColor = `hsla(4, 100%, 50%, ${alpha})`;
          ctx.fillStyle = `hsla(4, 100%, 55%, ${alpha})`;
        } else {
          ctx.shadowBlur = 6;
          ctx.shadowColor = `hsla(190, 100%, 50%, ${alpha * 0.5})`;
          ctx.fillStyle = `hsla(190, 100%, 60%, ${alpha * 0.6})`;
        }

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();

        // Draw trail
        if (p.isAnomaly) {
          ctx.strokeStyle = `hsla(4, 100%, 50%, ${alpha * 0.3})`;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(p.x - p.vx * 8, p.y - p.vy * 8);
          ctx.lineTo(p.x, p.y);
          ctx.stroke();
        }

        ctx.shadowBlur = 0;

        return p.life < p.maxLife && p.x < canvas.width + 20;
      });

      // Rate limit wall
      const wallX = canvas.width * 0.75;
      const hitCount = particlesRef.current.filter(
        (p) => Math.abs(p.x - wallX) < 30
      ).length;
      if (hitCount > 0) {
        ctx.strokeStyle = `hsla(40, 100%, 55%, ${Math.min(hitCount * 0.05, 0.4)})`;
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 8]);
        ctx.beginPath();
        ctx.moveTo(wallX, 0);
        ctx.lineTo(wallX, canvas.height);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      animFrameRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(animFrameRef.current);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full"
      style={{ opacity: 0.7 }}
    />
  );
};

export default ParticleCanvas;
