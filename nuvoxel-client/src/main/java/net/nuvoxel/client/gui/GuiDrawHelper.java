package net.nuvoxel.client.gui;

import net.minecraft.client.gui.DrawContext;

/**
 * Low-level drawing helpers for glass panels, rounded rects, gradients and glow effects.
 */
public final class GuiDrawHelper {

    private GuiDrawHelper() {}

    public static void fillRounded(DrawContext ctx, int x, int y, int w, int h, int radius, int color) {
        if (radius <= 0) {
            ctx.fill(x, y, x + w, y + h, color);
            return;
        }
        radius = Math.min(radius, Math.min(w, h) / 2);
        ctx.fill(x + radius, y, x + w - radius, y + h, color);
        ctx.fill(x, y + radius, x + w, y + h - radius, color);
        fillCorner(ctx, x, y, radius, color, 0);
        fillCorner(ctx, x + w - radius, y, radius, color, 1);
        fillCorner(ctx, x, y + h - radius, radius, color, 2);
        fillCorner(ctx, x + w - radius, y + h - radius, radius, color, 3);
    }

    private static void fillCorner(DrawContext ctx, int cx, int cy, int r, int color, int quadrant) {
        for (int dy = 0; dy < r; dy++) {
            for (int dx = 0; dx < r; dx++) {
                if (dx * dx + dy * dy > r * r) continue;
                int px = switch (quadrant) {
                    case 0 -> cx + (r - 1 - dx);
                    case 1 -> cx + dx;
                    case 2 -> cx + (r - 1 - dx);
                    default -> cx + dx;
                };
                int py = switch (quadrant) {
                    case 0, 1 -> cy + (r - 1 - dy);
                    default -> cy + dy;
                };
                ctx.fill(px, py, px + 1, py + 1, color);
            }
        }
    }

    public static void fillHorizontalGradient(DrawContext ctx, int x, int y, int w, int h, int left, int right) {
        for (int i = 0; i < w; i++) {
            int col = NuvoxelTheme.lerpColor(left, right, w <= 1 ? 0f : (float) i / (w - 1));
            ctx.fill(x + i, y, x + i + 1, y + h, col);
        }
    }

    public static void fillVerticalGradient(DrawContext ctx, int x, int y, int w, int h, int top, int bottom) {
        for (int i = 0; i < h; i++) {
            int col = NuvoxelTheme.lerpColor(top, bottom, h <= 1 ? 0f : (float) i / (h - 1));
            ctx.fill(x, y + i, x + w, y + i + 1, col);
        }
    }

    public static void drawGlowBorder(DrawContext ctx, int x, int y, int w, int h, int color, int thickness) {
        ctx.fill(x, y, x + w, y + thickness, color);
        ctx.fill(x, y + h - thickness, x + w, y + h, color);
        ctx.fill(x, y, x + thickness, y + h, color);
        ctx.fill(x + w - thickness, y, x + w, y + h, color);
    }

    public static void drawGlassPanel(DrawContext ctx, int x, int y, int w, int h, int radius) {
        ctx.fill(x + 3, y + 3, x + w + 3, y + h + 3, NuvoxelTheme.withAlpha(NuvoxelTheme.SHADOW, 0x60));
        fillRounded(ctx, x, y, w, h, radius, NuvoxelTheme.BG_PANEL);
        fillHorizontalGradient(ctx, x + 1, y + 1, w - 2, 1,
                NuvoxelTheme.withAlpha(NuvoxelTheme.ACCENT_CYAN, 0x80),
                NuvoxelTheme.withAlpha(NuvoxelTheme.ACCENT_PURPLE, 0x80));
        drawGlowBorder(ctx, x, y, w, h, NuvoxelTheme.withAlpha(NuvoxelTheme.BORDER, 0xCC), 1);
    }

    public static void drawAnimatedAccentLine(DrawContext ctx, int x, int y, int w, int baseColor, long timeMs) {
        for (int i = 0; i < w; i++) {
            float t = (float) i / Math.max(1, w - 1);
            float hueShift = ((timeMs / 40f + i * 3) % 360) / 360f;
            int shifted = shiftHue(baseColor, hueShift * 0.25f);
            int col = NuvoxelTheme.lerpColor(baseColor, shifted, 0.5f + 0.5f * (float) Math.sin(t * Math.PI));
            ctx.fill(x + i, y, x + i + 1, y + 2, col);
        }
    }

    public static void drawToggleSwitch(DrawContext ctx, int x, int y, int w, int h, boolean on, int accent, float anim) {
        int bg = NuvoxelTheme.lerpColor(0xFF2A2A4A, accent, on ? anim : 0f);
        fillRounded(ctx, x, y, w, h, h / 2, bg);
        int knobSize = h - 4;
        int knobX = on
                ? (int) (x + 2 + (w - knobSize - 4) * anim)
                : (int) (x + 2 + (w - knobSize - 4) * (1f - anim));
        fillRounded(ctx, knobX, y + 2, knobSize, knobSize, knobSize / 2, 0xFFFFFFFF);
    }

    public static void drawParticleField(DrawContext ctx, int width, int height, long seed, float alpha) {
        int count = Math.max(20, (width * height) / 25000);
        for (int i = 0; i < count; i++) {
            long t = System.currentTimeMillis() / 30 + seed + i * 997;
            int px = (int) ((t * (3 + i % 5) + i * 131) % Math.max(1, width));
            int py = (int) ((t * (2 + i % 3) + i * 79) % Math.max(1, height));
            int size = 1 + (i % 2);
            int a = (int) (alpha * (40 + (i * 17) % 60));
            int col = NuvoxelTheme.withAlpha(NuvoxelTheme.ACCENT_CYAN, a);
            ctx.fill(px, py, px + size, py + size, col);
        }
    }

    private static int shiftHue(int color, float shift) {
        float[] hsb = java.awt.Color.RGBtoHSB((color >> 16) & 0xFF, (color >> 8) & 0xFF, color & 0xFF, null);
        return java.awt.Color.HSBtoRGB((hsb[0] + shift) % 1f, hsb[1], hsb[2]) | 0xFF000000;
    }
}
