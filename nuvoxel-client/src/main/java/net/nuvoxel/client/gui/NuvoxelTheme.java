package net.nuvoxel.client.gui;

/**
 * Premium color theme for the Nuvoxel Client GUI.
 * All colors use ARGB format (0xAARRGGBB).
 */
public final class NuvoxelTheme {

    // ── Main Palette ──
    public static final int BG_PRIMARY = 0xE6101020;        // Deep dark blue-black
    public static final int BG_SECONDARY = 0xF01A1A2E;      // Slightly lighter
    public static final int BG_PANEL = 0xF0141428;           // Panel background
    public static final int BG_HOVER = 0xFF1E1E3A;           // Hover state
    public static final int BG_ACTIVE = 0xFF252548;           // Active/selected

    // ── Accent Colors ──
    public static final int ACCENT_CYAN = 0xFF00D4FF;
    public static final int ACCENT_PURPLE = 0xFF7C4DFF;
    public static final int ACCENT_PINK = 0xFFFF6B9D;
    public static final int ACCENT_GREEN = 0xFF00E676;
    public static final int ACCENT_AMBER = 0xFFFFAB40;
    public static final int ACCENT_RED = 0xFFFF5252;

    // ── Gradient Colors ──
    public static final int GRADIENT_START = 0xFF00D4FF;     // Cyan
    public static final int GRADIENT_END = 0xFF7C4DFF;       // Purple

    // ── Text Colors ──
    public static final int TEXT_PRIMARY = 0xFFFFFFFF;
    public static final int TEXT_SECONDARY = 0xFFB0B0CC;
    public static final int TEXT_MUTED = 0xFF6E6E8A;
    public static final int TEXT_DISABLED = 0xFF444466;

    // ── Border ──
    public static final int BORDER = 0xFF2A2A4A;
    public static final int BORDER_ACCENT = 0xFF00D4FF;
    public static final int BORDER_GLOW = 0x4000D4FF;

    // ── Module State Colors ──
    public static final int MODULE_ON = 0xFF00E676;
    public static final int MODULE_OFF = 0xFF444466;

    // ── Shadow & Effects ──
    public static final int SHADOW = 0x80000000;
    public static final int GLOW_CYAN = 0x3000D4FF;
    public static final int GLOW_PURPLE = 0x307C4DFF;

    /** Interpolate between two ARGB colors. */
    public static int lerpColor(int c1, int c2, float t) {
        t = Math.max(0, Math.min(1, t));
        int a = (int) (((c1 >> 24) & 0xFF) + (((c2 >> 24) & 0xFF) - ((c1 >> 24) & 0xFF)) * t);
        int r = (int) (((c1 >> 16) & 0xFF) + (((c2 >> 16) & 0xFF) - ((c1 >> 16) & 0xFF)) * t);
        int g = (int) (((c1 >> 8) & 0xFF) + (((c2 >> 8) & 0xFF) - ((c1 >> 8) & 0xFF)) * t);
        int b = (int) ((c1 & 0xFF) + ((c2 & 0xFF) - (c1 & 0xFF)) * t);
        return (a << 24) | (r << 16) | (g << 8) | b;
    }

    /** Create a rainbow color based on time offset. */
    public static int rainbow(long offset) {
        float hue = ((System.currentTimeMillis() + offset) % 3600) / 3600f;
        return java.awt.Color.HSBtoRGB(hue, 0.7f, 1.0f) | 0xFF000000;
    }

    /** Apply alpha to a color. */
    public static int withAlpha(int color, int alpha) {
        return (color & 0x00FFFFFF) | (alpha << 24);
    }
}
