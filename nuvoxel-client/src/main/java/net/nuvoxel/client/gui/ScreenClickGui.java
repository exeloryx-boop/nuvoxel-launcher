package net.nuvoxel.client.gui;

import net.minecraft.client.gui.DrawContext;
import net.minecraft.client.gui.screen.Screen;
import net.minecraft.text.Text;
import net.nuvoxel.client.NuvoxelClient;
import net.nuvoxel.client.core.Category;
import net.nuvoxel.client.core.Module;
import net.nuvoxel.client.core.ModuleManager;

import java.util.*;

/**
 * Premium ClickGUI Screen with draggable dropdown panels,
 * glassmorphism effects, smooth animations, and gradient accents.
 *
 * Each category has its own panel that can be expanded/collapsed.
 * Modules are shown as toggle rows with animated switches.
 */
public class ScreenClickGui extends Screen {

    private final ModuleManager moduleManager;
    private final List<CategoryPanel> panels = new ArrayList<>();
    private CategoryPanel draggingPanel = null;
    private int dragOffsetX, dragOffsetY;
    private float fadeIn = 0f;

    public ScreenClickGui(ModuleManager moduleManager) {
        super(Text.of("Nuvoxel ClickGUI"));
        this.moduleManager = moduleManager;


        // Create panels for each category
        int startX = 20;
        int startY = 30;
        for (Category cat : Category.values()) {
            panels.add(new CategoryPanel(cat, startX, startY, 160));
            startX += 170;
        }
    }

    @Override
    public boolean shouldPause() {
        return false;
    }

    @Override
    public void render(DrawContext context, int mouseX, int mouseY, float delta) {
        // Animate fade-in
        fadeIn = Math.min(1f, fadeIn + delta * 0.08f);

        int bgAlpha = (int)(0xA0 * fadeIn);

        // Dark overlay background with blur effect
        context.fill(0, 0, width, height, (bgAlpha << 24) | 0x080818);

        // Draw decorative grid pattern
        drawGridPattern(context);

        // Title at top
        drawTitle(context);

        // Render each category panel
        for (CategoryPanel panel : panels) {
            renderPanel(context, panel, mouseX, mouseY);
        }

        // Footer hint
        String hint = "§7Press §fRSHIFT§7 or §fESC§7 to close  §8|  §7Click modules to toggle";
        int hintWidth = textRenderer.getWidth("Press RSHIFT or ESC to close  |  Click modules to toggle");
        context.drawTextWithShadow(textRenderer, hint, (width - hintWidth) / 2, height - 15, 0x80FFFFFF);
    }

    private void drawTitle(DrawContext context) {
        long time = System.currentTimeMillis();
        float hue = (time % 4000) / 4000f;
        int gradientColor = java.awt.Color.HSBtoRGB(hue, 0.6f, 1.0f) | 0xFF000000;

        String title = "✦ NUVOXEL CLIENT";
        String version = "v" + NuvoxelClient.VERSION + " — Visual Enhancement Mod";
        int titleWidth = textRenderer.getWidth(title);
        int versionWidth = textRenderer.getWidth(version);

        // Title background pill
        int cx = width / 2;
        int pillWidth = Math.max(titleWidth, versionWidth) + 20;
        context.fill(cx - pillWidth / 2, 4, cx + pillWidth / 2, 26, 0xC0101020);

        // Top gradient line
        for (int i = 0; i < pillWidth; i++) {
            float t = (float) i / pillWidth;
            float h = (hue + t * 0.3f) % 1f;
            int col = java.awt.Color.HSBtoRGB(h, 0.7f, 1.0f) | 0xFF000000;
            context.fill(cx - pillWidth / 2 + i, 4, cx - pillWidth / 2 + i + 1, 5, col);
        }

        context.drawTextWithShadow(textRenderer, title, cx - titleWidth / 2, 8, gradientColor);
        context.drawTextWithShadow(textRenderer, version, cx - versionWidth / 2, 18, 0xFF808099);
    }

    private void drawGridPattern(DrawContext context) {
        // Subtle grid lines for premium feel
        int gridAlpha = (int)(0x08 * fadeIn);
        int gridColor = (gridAlpha << 24) | 0x4488FF;
        for (int x = 0; x < width; x += 40) {
            context.fill(x, 0, x + 1, height, gridColor);
        }
        for (int y = 0; y < height; y += 40) {
            context.fill(0, y, width, y + 1, gridColor);
        }
    }

    private void renderPanel(DrawContext context, CategoryPanel panel, int mouseX, int mouseY) {
        int x = panel.x;
        int y = panel.y;
        int w = panel.width;
        long time = System.currentTimeMillis();
        Category cat = panel.category;

        // Category color
        int catColor = getCategoryArgb(cat);
        int catColorDim = dimColor(catColor, 0.3f);

        // ── Panel header ──
        int headerHeight = 24;

        // Panel shadow
        context.fill(x + 2, y + 2, x + w + 2, y + headerHeight + 2, 0x40000000);

        // Header background with gradient
        context.fill(x, y, x + w, y + headerHeight, 0xF0161630);

        // Top accent line (animated gradient)
        for (int i = 0; i < w; i++) {
            float t = (float) i / w;
            float hueShift = ((time / 30f + i * 2) % 360) / 360f;
            int col = lerpColor(catColor, shiftHue(catColor, hueShift * 0.5f), t);
            context.fill(x + i, y, x + i + 1, y + 2, col);
        }

        // Category icon and name
        String header = cat.getIcon() + " " + cat.getDisplayName();
        context.drawTextWithShadow(textRenderer, header, x + 6, y + 7, catColor);

        // Expand/collapse indicator
        String arrow = panel.expanded ? "▼" : "▶";
        context.drawTextWithShadow(textRenderer, arrow, x + w - 14, y + 7, 0xFF808099);

        if (!panel.expanded) return;

        // ── Module rows ──
        List<Module> modules = moduleManager.getModules(cat);
        int rowHeight = 22;
        int currentY = y + headerHeight;

        for (int i = 0; i < modules.size(); i++) {
            Module mod = modules.get(i);
            boolean hover = mouseX >= x && mouseX <= x + w
                    && mouseY >= currentY && mouseY <= currentY + rowHeight;

            // Row background
            int rowBg = hover ? 0xE0202045 : 0xE0141430;
            context.fill(x, currentY, x + w, currentY + rowHeight, rowBg);

            // Left accent line when enabled
            if (mod.isEnabled()) {
                context.fill(x, currentY, x + 2, currentY + rowHeight, catColor);
            }

            // Module name
            int textColor = mod.isEnabled() ? 0xFFFFFFFF : 0xFF808099;
            context.drawTextWithShadow(textRenderer, mod.getName(), x + 8, currentY + 6, textColor);

            // Toggle switch (right side)
            int switchX = x + w - 28;
            int switchY = currentY + 6;
            int switchW = 20;
            int switchH = 10;

            // Switch background
            int switchBg = mod.isEnabled() ? catColor : 0xFF2A2A4A;
            context.fill(switchX, switchY, switchX + switchW, switchY + switchH, switchBg);

            // Switch knob
            int knobX = mod.isEnabled() ? switchX + switchW - 6 : switchX + 2;
            context.fill(knobX, switchY + 2, knobX + 4, switchY + switchH - 2, 0xFFFFFFFF);

            // Keybind indicator
            if (mod.getKeybind() != 0) {
                String keyText = getKeyName(mod.getKeybind());
                int keyWidth = textRenderer.getWidth(keyText);
                context.drawTextWithShadow(textRenderer, keyText, switchX - keyWidth - 4, currentY + 6, 0xFF4A4A6A);
            }

            // Bottom separator
            context.fill(x + 4, currentY + rowHeight - 1, x + w - 4, currentY + rowHeight, 0x20FFFFFF);

            currentY += rowHeight;
        }

        // Panel bottom edge
        context.fill(x, currentY, x + w, currentY + 2, catColorDim);

        panel.totalHeight = currentY - y + 2;
    }

    @Override
    public boolean mouseClicked(double mouseX, double mouseY, int button) {
        if (button != 0) return super.mouseClicked(mouseX, mouseY, button);

        int mx = (int) mouseX;
        int my = (int) mouseY;

        for (int p = panels.size() - 1; p >= 0; p--) {
            CategoryPanel panel = panels.get(p);
            int headerHeight = 24;

            // Check header click (drag or collapse)
            if (mx >= panel.x && mx <= panel.x + panel.width
                    && my >= panel.y && my <= panel.y + headerHeight) {
                // Right side = collapse toggle
                if (mx >= panel.x + panel.width - 20) {
                    panel.expanded = !panel.expanded;
                } else {
                    // Start dragging
                    draggingPanel = panel;
                    dragOffsetX = mx - panel.x;
                    dragOffsetY = my - panel.y;
                }
                return true;
            }

            // Check module row clicks
            if (panel.expanded) {
                List<Module> modules = moduleManager.getModules(panel.category);
                int rowHeight = 22;
                int currentY = panel.y + headerHeight;

                for (Module mod : modules) {
                    if (mx >= panel.x && mx <= panel.x + panel.width
                            && my >= currentY && my <= currentY + rowHeight) {
                        mod.toggle();
                        return true;
                    }
                    currentY += rowHeight;
                }
            }
        }

        return super.mouseClicked(mouseX, mouseY, button);
    }

    @Override
    public boolean mouseDragged(double mouseX, double mouseY, int button, double deltaX, double deltaY) {
        if (draggingPanel != null) {
            draggingPanel.x = (int) mouseX - dragOffsetX;
            draggingPanel.y = (int) mouseY - dragOffsetY;
            return true;
        }
        return super.mouseDragged(mouseX, mouseY, button, deltaX, deltaY);
    }

    @Override
    public boolean mouseReleased(double mouseX, double mouseY, int button) {
        draggingPanel = null;
        return super.mouseReleased(mouseX, mouseY, button);
    }

    @Override
    public boolean keyPressed(int keyCode, int scanCode, int modifiers) {
        if (keyCode == 344) { // RSHIFT
            close();
            return true;
        }
        return super.keyPressed(keyCode, scanCode, modifiers);
    }

    // ── Helpers ──

    private int getCategoryArgb(Category cat) {
        switch (cat) {
            case VISUALS: return 0xFF00D4FF;
            case HUD:     return 0xFF7C4DFF;
            case RENDER:  return 0xFFFF6B9D;
            case WORLD:   return 0xFF00E676;
            case MISC:    return 0xFFFFAB40;
            default:      return 0xFFFFFFFF;
        }
    }

    private int dimColor(int color, float factor) {
        int a = (color >> 24) & 0xFF;
        int r = (int)(((color >> 16) & 0xFF) * factor);
        int g = (int)(((color >> 8) & 0xFF) * factor);
        int b = (int)((color & 0xFF) * factor);
        return (a << 24) | (r << 16) | (g << 8) | b;
    }

    private int shiftHue(int color, float shift) {
        float[] hsb = java.awt.Color.RGBtoHSB((color >> 16) & 0xFF, (color >> 8) & 0xFF, color & 0xFF, null);
        return java.awt.Color.HSBtoRGB((hsb[0] + shift) % 1f, hsb[1], hsb[2]) | 0xFF000000;
    }

    private static int lerpColor(int c1, int c2, float t) {
        int a = (int)(((c1 >> 24) & 0xFF) + (((c2 >> 24) & 0xFF) - ((c1 >> 24) & 0xFF)) * t);
        int r = (int)(((c1 >> 16) & 0xFF) + (((c2 >> 16) & 0xFF) - ((c1 >> 16) & 0xFF)) * t);
        int g = (int)(((c1 >> 8) & 0xFF) + (((c2 >> 8) & 0xFF) - ((c1 >> 8) & 0xFF)) * t);
        int b = (int)((c1 & 0xFF) + ((c2 & 0xFF) - (c1 & 0xFF)) * t);
        return (a << 24) | (r << 16) | (g << 8) | b;
    }

    private String getKeyName(int keyCode) {
        switch (keyCode) {
            case 67:  return "[C]";
            case 72:  return "[H]";
            case 80:  return "[P]";
            case 86:  return "[V]";
            case 90:  return "[Z]";
            default:  return "[" + keyCode + "]";
        }
    }

    /** Internal state for a category panel. */
    private static class CategoryPanel {
        Category category;
        int x, y, width;
        int totalHeight;
        boolean expanded = true;

        CategoryPanel(Category category, int x, int y, int width) {
            this.category = category;
            this.x = x;
            this.y = y;
            this.width = width;
        }
    }
}
