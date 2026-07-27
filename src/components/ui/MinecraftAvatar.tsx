import { useEffect, useRef } from "react";
import { User } from "lucide-react";
import type { SkinModel } from "@shared/skins";
import { getCapeImageUrl, getSkinAvatarUrl, getSkinBodyUrl } from "@shared/skins";
import { useAppStore } from "../../store/useAppStore";

interface MinecraftAvatarProps {
  username: string;
  skinUsername?: string;
  capeTextureUsername?: string;
  customSkinData?: string | null;
  customCapeData?: string | null;
  model?: SkinModel;
  size?: number;
  variant?: "head" | "body";
  direction?: "front" | "back";
  className?: string;
  lazy?: boolean;
}

export function MinecraftAvatar({
  username,
  skinUsername,
  capeTextureUsername,
  customSkinData,
  customCapeData,
  model = "classic",
  size = 32,
  variant = "head",
  direction = "front",
  className = "",
  lazy = false,
}: MinecraftAvatarProps) {
  const showSkins = useAppStore((s) => s.showSkins);

  if (!showSkins) {
    return (
      <div
        className={`flex items-center justify-center rounded-md bg-bg-elevated text-text-muted ${className}`}
        style={{ width: size, height: variant === "body" ? size * 2 : size }}
      >
        <User style={{ width: size * 0.55, height: size * 0.55 }} />
      </div>
    );
  }

  const renderAs = skinUsername ?? username;

  if (customSkinData) {
    if (variant === "body") {
      if (direction === "back") {
        return (
          <CustomSkinBodyBackPreview
            skinData={customSkinData}
            capeData={customCapeData ?? undefined}
            size={size}
            className={className}
          />
        );
      }
      return (
        <CustomSkinBodyPreview
          skinData={customSkinData}
          capeData={customCapeData ?? undefined}
          size={size}
          className={className}
        />
      );
    }

    return (
      <span
        aria-label={username}
        className={`inline-block rounded-md bg-bg-elevated ${className}`}
        style={{
          width: size,
          height: size,
          backgroundImage: `url("${customSkinData}")`,
          backgroundSize: `${size * 8}px ${size * 8}px`,
          backgroundPosition: `-${size}px -${size}px`,
          imageRendering: "pixelated",
        }}
      />
    );
  }

  const src =
    variant === "body"
      ? (direction === "back"
          ? `https://mc-heads.net/body/${encodeURIComponent(renderAs)}/back`
          : getSkinBodyUrl(renderAs, model))
      : getSkinAvatarUrl(renderAs, size, model);

  if (variant === "body" && (capeTextureUsername || customCapeData)) {
    const isBack = direction === "back";
    return (
      <div className={`relative inline-flex ${className}`}>
        <img
          src={customCapeData ?? getCapeImageUrl(capeTextureUsername!)}
          alt=""
          className={`pointer-events-none absolute left-1/2 top-[18%] -translate-x-1/2 ${
            isBack ? "z-10" : "-z-10"
          }`}
          style={{
            width: size * (isBack ? 0.95 : 1.35),
            imageRendering: "pixelated",
          }}
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = "none";
          }}
        />
        <img
          src={src}
          alt={username}
          loading={lazy ? "lazy" : undefined}
          decoding="async"
          style={{
            height: size * 2,
            width: "auto",
            imageRendering: "pixelated",
          }}
          onError={(e) => {
            const img = e.target as HTMLImageElement;
            const fallback = `https://mc-heads.net/body/${encodeURIComponent(renderAs)}/${isBack ? "back" : "left"}`;
            if (img.src !== fallback) img.src = fallback;
          }}
        />
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={username}
      width={size}
      height={size}
      loading={lazy ? "lazy" : undefined}
      decoding="async"
      className={`rounded-md object-cover ${className}`}
      style={
        variant === "body"
          ? { height: size * 2, width: "auto", imageRendering: "pixelated" }
          : { imageRendering: "pixelated" }
      }
      onError={(e) => {
        const img = e.target as HTMLImageElement;
        const fallback =
          variant === "body"
            ? `https://mc-heads.net/body/${encodeURIComponent(renderAs)}/${direction === "back" ? "back" : "left"}`
            : `https://mc-heads.net/avatar/${encodeURIComponent(renderAs)}/${size}`;
        if (img.src !== fallback) img.src = fallback;
      }}
    />
  );
}

function CustomSkinBodyPreview({
  skinData,
  capeData,
  size,
  className,
}: {
  skinData: string;
  capeData?: string;
  size: number;
  className: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext("2d");
    if (!context) return;

    let cancelled = false;
    const load = (src: string) =>
      new Promise<HTMLImageElement>((resolve, reject) => {
        const image = new Image();
        image.onload = () => resolve(image);
        image.onerror = reject;
        image.src = src;
      });

    void (async () => {
      try {
        const [skin, cape] = await Promise.all([
          load(skinData),
          capeData ? load(capeData).catch(() => null) : Promise.resolve(null),
        ]);
        if (cancelled) return;

        context.clearRect(0, 0, canvas.width, canvas.height);
        context.imageSmoothingEnabled = false;
        const scale = 4;
        const part = (
          source: CanvasImageSource,
          sx: number,
          sy: number,
          sw: number,
          sh: number,
          dx: number,
          dy: number,
        ) => context.drawImage(source, sx, sy, sw, sh, dx * scale, dy * scale, sw * scale, sh * scale);

        // The cape is deliberately behind the player; this makes the preview
        // useful even for custom cape layouts that are not from the catalog.
        if (cape) {
          context.drawImage(cape, 0, 0, cape.width, cape.height, 15 * scale, 9 * scale, 18 * scale, 28 * scale);
        }

        // Minecraft's standard 64×64 skin atlas: front-facing 2D character.
        part(skin, 8, 8, 8, 8, 20, 1); // head
        part(skin, 20, 20, 8, 12, 20, 9); // body
        part(skin, 44, 20, 4, 12, 16, 9); // right arm
        part(skin, 36, 52, 4, 12, 28, 9); // left arm
        part(skin, 4, 20, 4, 12, 20, 21); // right leg
        part(skin, 20, 52, 4, 12, 24, 21); // left leg

        if (skin.height >= 64) {
          part(skin, 40, 8, 8, 8, 20, 1); // hat layer
          part(skin, 20, 36, 8, 12, 20, 9); // jacket layer
          part(skin, 44, 36, 4, 12, 16, 9); // right sleeve
          part(skin, 52, 52, 4, 12, 28, 9); // left sleeve
          part(skin, 4, 36, 4, 12, 20, 21); // right trousers
          part(skin, 4, 52, 4, 12, 24, 21); // left trousers
        }
      } catch {
        if (!cancelled) context.clearRect(0, 0, canvas.width, canvas.height);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [skinData, capeData]);

  return (
    <canvas
      ref={canvasRef}
      aria-label="Custom Minecraft skin preview"
      width={48 * 4}
      height={34 * 4}
      className={`rounded-md ${className}`}
      style={{ width: size, height: size * 2, imageRendering: "pixelated" }}
    />
  );
}

function CustomSkinBodyBackPreview({
  skinData,
  capeData,
  size,
  className,
}: {
  skinData: string;
  capeData?: string;
  size: number;
  className: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext("2d");
    if (!context) return;

    let cancelled = false;
    const load = (src: string) =>
      new Promise<HTMLImageElement>((resolve, reject) => {
        const image = new Image();
        image.onload = () => resolve(image);
        image.onerror = reject;
        image.src = src;
      });

    void (async () => {
      try {
        const [skin, cape] = await Promise.all([
          load(skinData),
          capeData ? load(capeData).catch(() => null) : Promise.resolve(null),
        ]);
        if (cancelled) return;

        context.clearRect(0, 0, canvas.width, canvas.height);
        context.imageSmoothingEnabled = false;
        const scale = 4;
        const part = (
          source: CanvasImageSource,
          sx: number,
          sy: number,
          sw: number,
          sh: number,
          dx: number,
          dy: number,
        ) => context.drawImage(source, sx, sy, sw, sh, dx * scale, dy * scale, sw * scale, sh * scale);

        // BACK VIEW:
        // Draw the player's back body parts first
        part(skin, 24, 8, 8, 8, 20, 1); // head back
        part(skin, 32, 20, 8, 12, 20, 9); // body back
        part(skin, 52, 20, 4, 12, 16, 9); // right arm back (drawn on left side of back view)
        part(skin, 44, 52, 4, 12, 28, 9); // left arm back (drawn on right side of back view)
        part(skin, 12, 20, 4, 12, 20, 21); // right leg back
        part(skin, 28, 52, 4, 12, 24, 21); // left leg back

        if (skin.height >= 64) {
          part(skin, 56, 8, 8, 8, 20, 1); // hat layer back
          part(skin, 32, 36, 8, 12, 20, 9); // jacket layer back
          part(skin, 52, 36, 4, 12, 16, 9); // right sleeve back
          part(skin, 60, 52, 4, 12, 28, 9); // left sleeve back
          part(skin, 12, 36, 4, 12, 20, 21); // right trousers back
          part(skin, 12, 52, 4, 12, 24, 21); // left trousers back
        }

        // Draw Cape ON TOP of the back
        if (cape) {
          context.drawImage(cape, 0, 0, cape.width, cape.height, 19 * scale, 9 * scale, 10 * scale, 16 * scale);
        }
      } catch {
        if (!cancelled) context.clearRect(0, 0, canvas.width, canvas.height);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [skinData, capeData]);

  return (
    <canvas
      ref={canvasRef}
      aria-label="Custom Minecraft skin back preview"
      width={48 * 4}
      height={34 * 4}
      className={`rounded-md ${className}`}
      style={{ width: size, height: size * 2, imageRendering: "pixelated" }}
    />
  );
}
