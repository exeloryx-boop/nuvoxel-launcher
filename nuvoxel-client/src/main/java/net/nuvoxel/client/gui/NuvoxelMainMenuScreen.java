package net.nuvoxel.client.gui;

import net.minecraft.client.gui.DrawContext;
import net.minecraft.client.gui.screen.Screen;
import net.minecraft.client.gui.screen.TitleScreen;
import net.minecraft.client.gui.screen.multiplayer.MultiplayerScreen;
import net.minecraft.client.gui.screen.option.OptionsScreen;
import net.minecraft.client.gui.screen.world.SelectWorldScreen;
import net.minecraft.text.Text;
import net.minecraft.util.Util;
import net.nuvoxel.client.NuvoxelClient;
import net.nuvoxel.client.api.NuvoxelApiClient;
import net.nuvoxel.client.core.ModuleManager;

/**
 * Premium Nuvoxel-branded main menu — Lunar-inspired but with glass panels,
 * animated gradients, particle field and integrated Nuvoxel hub tab.
 */
public class NuvoxelMainMenuScreen extends Screen {

    private float fadeIn = 0f;
    private float logoPulse = 0f;
    private int selectedTab = 0; // 0 = Home, 1 = Nuvoxel Hub
    private boolean downloadHover = false;
    private boolean websiteHover = false;
    private boolean clickGuiHover = false;
    private boolean singleHover = false;
    private boolean multiHover = false;
    private boolean optionsHover = false;
    private boolean quitHover = false;

    public NuvoxelMainMenuScreen() {
        super(Text.of("Nuvoxel Client"));
    }

    @Override
    protected void init() {
        NuvoxelApiClient.prefetch();
    }

    @Override
    public boolean shouldCloseOnEsc() {
        return false;
    }

    @Override
    public void render(DrawContext context, int mouseX, int mouseY, float delta) {
        fadeIn = Math.min(1f, fadeIn + delta * 0.06f);
        logoPulse = (float) (0.5 + 0.5 * Math.sin(System.currentTimeMillis() / 600.0));

        renderBackground(context);
        renderSidebar(context, mouseX, mouseY);
        renderContent(context, mouseX, mouseY);
        renderFooter(context);
    }

    private void renderBackground(DrawContext context) {
        int alpha = (int) (0xF0 * fadeIn);
        GuiDrawHelper.fillVerticalGradient(context, 0, 0, width, height,
                NuvoxelTheme.withAlpha(0xFF060612, alpha),
                NuvoxelTheme.withAlpha(0xFF0E0E24, alpha));

        GuiDrawHelper.drawParticleField(context, width, height, 42L, fadeIn);

        long time = System.currentTimeMillis();
        int orbX = width / 2 + (int) (Math.sin(time / 2000.0) * 120);
        int orbY = height / 3 + (int) (Math.cos(time / 2500.0) * 60);
        context.fill(orbX - 80, orbY - 80, orbX + 80, orbY + 80, NuvoxelTheme.withAlpha(NuvoxelTheme.GLOW_CYAN, (int)(40 * fadeIn)));
        context.fill(orbX - 40, orbY - 40, orbX + 40, orbY + 40, NuvoxelTheme.withAlpha(NuvoxelTheme.GLOW_PURPLE, (int)(30 * fadeIn)));
    }

    private void renderSidebar(DrawContext context, int mouseX, int mouseY) {
        int sidebarW = 200;
        GuiDrawHelper.drawGlassPanel(context, 16, 16, sidebarW, height - 32, 10);

        // Logo
        String logo = "✦ NUVOXEL";
        String sub = "Premium Client";
        context.drawTextWithShadow(textRenderer, logo, 32, 36, NuvoxelTheme.rainbow(0));
        context.drawTextWithShadow(textRenderer, sub, 32, 50, NuvoxelTheme.TEXT_MUTED);

        GuiDrawHelper.drawAnimatedAccentLine(context, 32, 68, sidebarW - 32, NuvoxelTheme.ACCENT_CYAN, System.currentTimeMillis());

        // Tabs
        drawTab(context, 28, 82, sidebarW - 24, "Home", "◈", selectedTab == 0, mouseX, mouseY, 0);
        drawTab(context, 28, 118, sidebarW - 24, "Nuvoxel Hub", "✦", selectedTab == 1, mouseX, mouseY, 1);

        // Version badge
        int badgeY = height - 56;
        GuiDrawHelper.fillRounded(context, 28, badgeY, sidebarW - 24, 36, 6, NuvoxelTheme.BG_ACTIVE);
        context.drawTextWithShadow(textRenderer, "Client " + NuvoxelApiClient.getModVersionLabel(), 38, badgeY + 8, NuvoxelTheme.ACCENT_CYAN);
        context.drawTextWithShadow(textRenderer, "MC 1.21.4", 38, badgeY + 20, NuvoxelTheme.TEXT_MUTED);
    }

    private void drawTab(DrawContext ctx, int x, int y, int w, String label, String icon,
                         boolean selected, int mx, int my, int tabIndex) {
        boolean hover = mx >= x && mx <= x + w && my >= y && my <= y + 28;
        int bg = selected ? NuvoxelTheme.BG_ACTIVE : (hover ? NuvoxelTheme.BG_HOVER : 0x00000000);
        if (bg != 0) GuiDrawHelper.fillRounded(ctx, x, y, w, 28, 6, bg);
        if (selected) {
            ctx.fill(x, y + 4, x + 2, y + 24, NuvoxelTheme.ACCENT_CYAN);
        }
        int col = selected ? NuvoxelTheme.TEXT_PRIMARY : NuvoxelTheme.TEXT_SECONDARY;
        ctx.drawTextWithShadow(textRenderer, icon + "  " + label, x + 10, y + 9, col);
    }

    private void renderContent(DrawContext context, int mouseX, int mouseY) {
        int contentX = 232;
        int contentW = width - contentX - 24;

        if (selectedTab == 0) {
            renderHomeTab(context, contentX, 40, contentW, mouseX, mouseY);
        } else {
            renderNuvoxelHub(context, contentX, 40, contentW, mouseX, mouseY);
        }
    }

    private void renderHomeTab(DrawContext ctx, int x, int y, int w, int mx, int my) {
        // Hero card
        GuiDrawHelper.drawGlassPanel(ctx, x, y, w, 140, 12);
        String hero = "Welcome to Nuvoxel Client";
        ctx.drawTextWithShadow(textRenderer, hero, x + 20, y + 24, NuvoxelTheme.TEXT_PRIMARY);
        ctx.drawTextWithShadow(textRenderer, "Premium visuals • Custom HUD • ClickGUI • World effects",
                x + 20, y + 44, NuvoxelTheme.TEXT_SECONDARY);
        ctx.drawTextWithShadow(textRenderer, "Press RSHIFT in-game to open module settings",
                x + 20, y + 64, NuvoxelTheme.TEXT_MUTED);

        // Animated title line
        GuiDrawHelper.drawAnimatedAccentLine(ctx, x + 20, y + 90, w - 40, NuvoxelTheme.ACCENT_PURPLE, System.currentTimeMillis());

        String status = NuvoxelApiClient.getCached().online() ? "● API Online" : "○ API Offline";
        int statusCol = NuvoxelApiClient.getCached().online() ? NuvoxelTheme.ACCENT_GREEN : NuvoxelTheme.ACCENT_AMBER;
        ctx.drawTextWithShadow(textRenderer, status, x + 20, y + 110, statusCol);

        // Menu buttons
        int btnY = y + 160;
        int btnW = (w - 20) / 2;
        int btnH = 44;

        singleHover = drawMenuButton(ctx, x, btnY, btnW, btnH, "Singleplayer", "▶", mx, my);
        multiHover = drawMenuButton(ctx, x + btnW + 20, btnY, btnW, btnH, "Multiplayer", "◉", mx, my);

        btnY += btnH + 16;
        optionsHover = drawMenuButton(ctx, x, btnY, btnW, btnH, "Options", "⚙", mx, my);
        clickGuiHover = drawMenuButton(ctx, x + btnW + 20, btnY, btnW, btnH, "ClickGUI", "✦", mx, my);

        btnY += btnH + 16;
        quitHover = drawMenuButton(ctx, x + (w - btnW) / 2, btnY, btnW, btnH, "Quit Game", "✕", mx, my);
    }

    private void renderNuvoxelHub(DrawContext ctx, int x, int y, int w, int mx, int my) {
        var api = NuvoxelApiClient.getCached();

        GuiDrawHelper.drawGlassPanel(ctx, x, y, w, 100, 12);
        ctx.drawTextWithShadow(textRenderer, "✦ Nuvoxel Launcher Hub", x + 20, y + 20, NuvoxelTheme.rainbow(100));
        ctx.drawTextWithShadow(textRenderer, "Connected to nuvoxel-launcher.onrender.com",
                x + 20, y + 40, NuvoxelTheme.TEXT_SECONDARY);

        String statusLine = api.online()
                ? "● Server online  •  API v" + api.launcherVersion()
                : "○ Server offline — retrying...";
        ctx.drawTextWithShadow(textRenderer, statusLine, x + 20, y + 58,
                api.online() ? NuvoxelTheme.ACCENT_GREEN : NuvoxelTheme.ACCENT_AMBER);

        GuiDrawHelper.drawAnimatedAccentLine(ctx, x + 20, y + 78, w - 40, NuvoxelTheme.ACCENT_CYAN, System.currentTimeMillis());

        // Broadcast
        if (api.broadcastActive() && !api.broadcastText().isBlank()) {
            int bcColor = switch (api.broadcastType()) {
                case "warning" -> NuvoxelTheme.ACCENT_AMBER;
                case "alert" -> NuvoxelTheme.ACCENT_RED;
                default -> NuvoxelTheme.ACCENT_CYAN;
            };
            GuiDrawHelper.drawGlassPanel(ctx, x, y + 116, w, 52, 8);
            ctx.drawTextWithShadow(textRenderer, "Announcement", x + 16, y + 128, bcColor);
            String text = api.broadcastText();
            if (text.length() > 80) text = text.substring(0, 77) + "...";
            ctx.drawTextWithShadow(textRenderer, text, x + 16, y + 144, NuvoxelTheme.TEXT_PRIMARY);
        }

        int btnY = y + (api.broadcastActive() && !api.broadcastText().isBlank() ? 184 : 120);
        int btnW = (w - 16) / 2;
        int btnH = 48;

        downloadHover = drawActionButton(ctx, x, btnY, btnW, btnH,
                "Download Client Mod", "From launcher API", NuvoxelTheme.ACCENT_CYAN, mx, my);
        websiteHover = drawActionButton(ctx, x + btnW + 16, btnY, btnW, btnH,
                "Open Launcher Site", "nuvoxel-launcher.onrender.com", NuvoxelTheme.ACCENT_PURPLE, mx, my);

        btnY += btnH + 16;
        GuiDrawHelper.drawGlassPanel(ctx, x, btnY, w, 80, 8);
        ctx.drawTextWithShadow(textRenderer, "Mod download URL:", x + 16, btnY + 14, NuvoxelTheme.TEXT_MUTED);
        ctx.drawTextWithShadow(textRenderer, NuvoxelApiClient.CLIENT_JAR_URL, x + 16, btnY + 30, NuvoxelTheme.ACCENT_CYAN);
        ctx.drawTextWithShadow(textRenderer, "Installed: " + NuvoxelApiClient.getModVersionLabel(),
                x + 16, btnY + 50, NuvoxelTheme.TEXT_SECONDARY);
        ctx.drawTextWithShadow(textRenderer, "Use Nuvoxel Launcher for auto-updates before launch",
                x + 16, btnY + 64, NuvoxelTheme.TEXT_MUTED);
    }

    private boolean drawMenuButton(DrawContext ctx, int x, int y, int w, int h, String title, String icon, int mx, int my) {
        boolean hover = mx >= x && mx <= x + w && my >= y && my <= y + h;
        int bg = hover ? NuvoxelTheme.BG_HOVER : NuvoxelTheme.BG_SECONDARY;
        GuiDrawHelper.drawGlassPanel(ctx, x, y, w, h, 8);
        if (hover) {
            GuiDrawHelper.drawGlowBorder(ctx, x, y, w, h, NuvoxelTheme.withAlpha(NuvoxelTheme.ACCENT_CYAN, 0x80), 1);
        }
        ctx.fill(x, y, x + w, y + 2, hover ? NuvoxelTheme.ACCENT_CYAN : NuvoxelTheme.withAlpha(NuvoxelTheme.ACCENT_CYAN, 0x40));
        ctx.drawTextWithShadow(textRenderer, icon + "  " + title, x + 16, y + h / 2 - 4, NuvoxelTheme.TEXT_PRIMARY);
        return hover;
    }

    private boolean drawActionButton(DrawContext ctx, int x, int y, int w, int h,
                                     String title, String subtitle, int accent, int mx, int my) {
        boolean hover = mx >= x && mx <= x + w && my >= y && my <= y + h;
        GuiDrawHelper.drawGlassPanel(ctx, x, y, w, h, 10);
        if (hover) {
            GuiDrawHelper.fillHorizontalGradient(ctx, x + 1, y + 1, w - 2, h - 2,
                    NuvoxelTheme.withAlpha(accent, 0x30), NuvoxelTheme.withAlpha(NuvoxelTheme.ACCENT_PURPLE, 0x20));
            GuiDrawHelper.drawGlowBorder(ctx, x, y, w, h, NuvoxelTheme.withAlpha(accent, 0xCC), 2);
        }
        ctx.drawTextWithShadow(textRenderer, title, x + 14, y + 14, hover ? accent : NuvoxelTheme.TEXT_PRIMARY);
        ctx.drawTextWithShadow(textRenderer, subtitle, x + 14, y + 30, NuvoxelTheme.TEXT_MUTED);
        return hover;
    }

    private void renderFooter(DrawContext context) {
        String hint = "Nuvoxel Client " + NuvoxelApiClient.getModVersionLabel() + "  •  Inspired by premium clients, built for Fabric";
        int tw = textRenderer.getWidth(hint);
        context.drawTextWithShadow(textRenderer, hint, (width - tw) / 2, height - 12, NuvoxelTheme.TEXT_MUTED);
    }

    @Override
    public boolean mouseClicked(double mouseX, double mouseY, int button) {
        if (button != 0) return super.mouseClicked(mouseX, mouseY, button);
        int mx = (int) mouseX;
        int my = (int) mouseY;

        // Sidebar tabs
        if (mx >= 28 && mx <= 204) {
            if (my >= 82 && my <= 110) { selectedTab = 0; return true; }
            if (my >= 118 && my <= 146) { selectedTab = 1; NuvoxelApiClient.refreshAsync(); return true; }
        }

        if (selectedTab == 0) {
            if (singleHover) { client.setScreen(new SelectWorldScreen(this)); return true; }
            if (multiHover) { client.setScreen(new MultiplayerScreen(this)); return true; }
            if (optionsHover) { client.setScreen(new OptionsScreen(this, client.options)); return true; }
            if (clickGuiHover) {
                ModuleManager mm = NuvoxelClient.getModuleManager();
                if (mm != null) client.setScreen(new ScreenClickGui(mm));
                return true;
            }
            if (quitHover) { client.scheduleStop(); return true; }
        } else {
            if (downloadHover) {
                Util.getOperatingSystem().open(NuvoxelApiClient.CLIENT_JAR_URL);
                return true;
            }
            if (websiteHover) {
                Util.getOperatingSystem().open(NuvoxelApiClient.WEBSITE_URL);
                return true;
            }
        }

        return super.mouseClicked(mouseX, mouseY, button);
    }

    /** Allow vanilla title screen access via hidden action if needed. */
    public static Screen createWithVanillaFallback() {
        return new NuvoxelMainMenuScreen();
    }
}
