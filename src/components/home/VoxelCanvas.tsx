import { useEffect, useRef } from "react";
import { useAppStore } from "../../store/useAppStore";

interface Voxel {
  x: number;
  y: number;
  z: number;
  baseX: number;
  baseY: number;
  baseZ: number;
  size: number;
  speed: number;
  angle: number;
  rotSpeed: number;
  colorShift: number;
}

export function VoxelCanvas() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const mouseRef = useRef({ x: 0, y: 0, targetX: 0, targetY: 0 });
  const activePreset = useAppStore((s) => s.homeBackgroundPreset);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationId: number;
    let width = (canvas.width = canvas.offsetWidth);
    let height = (canvas.height = canvas.offsetHeight);

    // Initialize voxels
    const voxels: Voxel[] = [];
    const count = 35;

    for (let i = 0; i < count; i++) {
      const rx = Math.random() * width;
      const ry = Math.random() * height;
      const rz = Math.random() * 200 - 100;
      voxels.push({
        x: rx,
        y: ry,
        z: rz,
        baseX: rx,
        baseY: ry,
        baseZ: rz,
        size: Math.random() * 14 + 10,
        speed: Math.random() * 0.4 + 0.1,
        angle: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 0.015,
        colorShift: Math.random() * 360,
      });
    }

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = canvas.offsetWidth;
      height = canvas.height = canvas.offsetHeight;
    };

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouseRef.current.targetX = e.clientX - rect.left;
      mouseRef.current.targetY = e.clientY - rect.top;
    };

    window.addEventListener("resize", handleResize);
    window.addEventListener("mousemove", handleMouseMove);

    // Function to draw an isometric voxel
    const drawVoxel = (
      c: CanvasRenderingContext2D,
      px: number,
      py: number,
      size: number,
      angle: number,
      accentColor: string,
    ) => {
      // Create isometric vectors with rotation
      const cosA = Math.cos(angle);
      const sinA = Math.sin(angle);

      // Isometric projection factors
      const ux = size * cosA;
      const uy = (size / 2) * sinA;
      const vx = -size * sinA;
      const vy = (size / 2) * cosA;
      const h = size * 1.2; // height of the block

      // Top face vertices
      const t1 = { x: px, y: py - h };
      const t2 = { x: px + ux, y: py - h + uy };
      const t3 = { x: px + ux + vx, y: py - h + uy + vy };
      const t4 = { x: px + vx, y: py - h + vy };

      // Bottom / side projection vertices
      const b2 = { x: t2.x, y: t2.y + h };
      const b3 = { x: t3.x, y: t3.y + h };
      const b4 = { x: t4.x, y: t4.y + h };

      // Helper to draw shaded face
      const drawFace = (
        p1: { x: number; y: number },
        p2: { x: number; y: number },
        p3: { x: number; y: number },
        p4: { x: number; y: number },
        fill: string,
      ) => {
        c.beginPath();
        c.moveTo(p1.x, p1.y);
        c.lineTo(p2.x, p2.y);
        c.lineTo(p3.x, p3.y);
        c.lineTo(p4.x, p4.y);
        c.closePath();
        c.fillStyle = fill;
        c.fill();
        c.strokeStyle = "rgba(255, 255, 255, 0.05)";
        c.lineWidth = 0.5;
        c.stroke();
      };

      // Shading colors based on accent color
      let baseColor = accentColor || "#3b82f6";
      
      // Draw faces from back to front (painter's algorithm)
      // Top face (brightest)
      drawFace(t1, t2, t3, t4, `color-mix(in srgb, ${baseColor} 90%, white 10%)`);
      // Front-left face (medium shading)
      drawFace(t4, t3, b3, b4, `color-mix(in srgb, ${baseColor} 65%, black 35%)`);
      // Front-right face (darkest shading)
      drawFace(t3, t2, b2, b3, `color-mix(in srgb, ${baseColor} 45%, black 55%)`);
    };

    // Get current accent color from CSS
    const getAccentColor = () => {
      const style = getComputedStyle(document.documentElement);
      return style.getPropertyValue("--accent").trim() || "#3b82f6";
    };

    let tick = 0;
    const render = () => {
      tick++;
      ctx.clearRect(0, 0, width, height);

      // Smooth mouse follow
      const m = mouseRef.current;
      m.x += (m.targetX - m.x) * 0.08;
      m.y += (m.targetY - m.y) * 0.08;

      const accent = getAccentColor();

      // Sort voxels by simulated depth
      const sortedVoxels = [...voxels].sort((a, b) => {
        const depthA = a.z + (a.x + a.y) * 0.1;
        const depthB = b.z + (b.x + b.y) * 0.1;
        return depthA - depthB;
      });

      for (const voxel of sortedVoxels) {
        // Slow float animation
        voxel.angle += voxel.rotSpeed;
        voxel.y = voxel.baseY + Math.sin(tick * 0.01 * voxel.speed + voxel.colorShift) * 15;
        
        // Horizontal drift
        voxel.x += voxel.speed * 0.15;
        if (voxel.x > width + 40) {
          voxel.x = -40;
          voxel.baseX = -40;
        }

        // Parallax offset based on cursor position
        const dx = m.x - width / 2;
        const dy = m.y - height / 2;

        const parallaxFactor = (voxel.z + 150) * 0.0005;
        const drawX = voxel.x + dx * parallaxFactor;
        const drawY = voxel.y + dy * parallaxFactor;

        // Voxel glow / light transparency based on depth
        const alpha = Math.max(0.15, Math.min(0.55, (voxel.z + 150) / 250));
        ctx.globalAlpha = alpha;

        drawVoxel(ctx, drawX, drawY, voxel.size, voxel.angle, accent);
      }

      ctx.globalAlpha = 1.0;
      animationId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("mousemove", handleMouseMove);
      cancelAnimationFrame(animationId);
    };
  }, [activePreset]);

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none absolute inset-0 h-full w-full opacity-80"
    />
  );
}
