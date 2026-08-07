package net.nuvoxel.client.mixin;

import net.minecraft.client.MinecraftClient;
import net.minecraft.client.gui.DrawContext;
import net.minecraft.client.gui.hud.InGameHud;
import net.minecraft.client.render.RenderTickCounter;
import net.minecraft.entity.effect.StatusEffectInstance;
import net.minecraft.item.ItemStack;
import net.minecraft.util.math.MathHelper;
import net.nuvoxel.client.NuvoxelClient;
import net.nuvoxel.client.core.Module;
import net.nuvoxel.client.gui.ScreenClickGui;
import org.lwjgl.glfw.GLFW;
import org.spongepowered.asm.mixin.Mixin;
import org.spongepowered.asm.mixin.injection.At;
import org.spongepowered.asm.mixin.injection.Inject;
import org.spongepowered.asm.mixin.injection.callback.CallbackInfo;

import java.awt.Color;
import java.util.Collection;
import java.util.List;

/**
 * Enhanced Mixin into InGameHud.render to draw feature-rich HUD visual components:
 * - Animated Watermark
 * - Module List with rainbow accent bars
 * - Keystrokes (WASD + Mouse)
 * - Custom Crosshair
 * - Player Stats & Health Bar
 * - Armor Status (Armor & held item durability overlay)
 * - Active Potion Effects list
 * - DirectionHUD Compass
 * - Coordinates & FPS
 */
@Mixin(InGameHud.class)
public abstract class InGameHudMixin {

    @Inject(method = "render", at = @At("TAIL"))
    private void nuvoxel$onRender(DrawContext context, RenderTickCounter tickCounter, CallbackInfo ci) {
        if (!NuvoxelClient.isReady()) return;

        MinecraftClient client = MinecraftClient.getInstance();
        if (client.player == null) return;
        if (client.currentScreen instanceof ScreenClickGui) return;

        int width = context.getScaledWindowWidth();
        int height = context.getScaledWindowHeight();
        long time = System.currentTimeMillis();

        // 1. Watermark
        Module watermarkMod = NuvoxelClient.getModuleManager().getModule("Watermark");
        if (watermarkMod != null && watermarkMod.isEnabled()) {
            renderWatermark(context, client, time);
        }

        // 2. Active Module List
        renderActiveModules(context, client, width, time);

        // 3. Custom Crosshair
        Module crosshairMod = NuvoxelClient.getModuleManager().getModule("Crosshair");
        if (crosshairMod != null && crosshairMod.isEnabled()) {
            renderCustomCrosshair(context, width, height, time);
        }

        // 4. DirectionHUD (Compass)
        Module dirMod = NuvoxelClient.getModuleManager().getModule("DirectionHUD");
        if (dirMod != null && dirMod.isEnabled()) {
            renderDirectionHud(context, client, width);
        }

        // 5. Keystrokes Overlay
        Module keystrokesMod = NuvoxelClient.getModuleManager().getModule("Keystrokes");
        if (keystrokesMod != null && keystrokesMod.isEnabled()) {
            renderKeystrokes(context, client, height);
        }

        // 6. Player Stats / TargetHUD
        Module statsMod = NuvoxelClient.getModuleManager().getModule("PlayerStats");
        if (statsMod != null && statsMod.isEnabled()) {
            renderPlayerStats(context, client, height);
        }

        // 7. Armor Status Overlay
        Module armorMod = NuvoxelClient.getModuleManager().getModule("ArmorStatus");
        if (armorMod != null && armorMod.isEnabled()) {
            renderArmorStatus(context, client, width, height);
        }

        // 8. Potion Display Overlay
        Module potionMod = NuvoxelClient.getModuleManager().getModule("PotionDisplay");
        if (potionMod != null && potionMod.isEnabled()) {
            renderPotionDisplay(context, client, height);
        }

        // 8.5 Block Overlay Info
        Module blockOverlayMod = NuvoxelClient.getModuleManager().getModule("BlockOverlay");
        if (blockOverlayMod instanceof net.nuvoxel.client.modules.visuals.BlockOverlay bo && bo.isEnabled()) {
            String info = bo.getTargetBlockInfo();
            if (!info.isEmpty()) {
                int w = client.textRenderer.getWidth(info);
                int x = (width - w) / 2;
                int y = height / 2 + 15;
                context.fill(x - 4, y - 2, x + w + 4, y + 11, 0xCC0D0E17);
                context.drawTextWithShadow(client.textRenderer, info, x, y, 0xFF00E5FF);
            }
        }

        // 9. FPS & Coords
        renderInfoOverlay(context, client, height);
    }

    private void renderWatermark(DrawContext context, MinecraftClient client, long time) {
        float hue1 = (time % 4000) / 4000f;
        float hue2 = ((time + 1200) % 4000) / 4000f;
        int col1 = Color.HSBtoRGB(hue1, 0.7f, 1.0f) | 0xFF000000;
        int col2 = Color.HSBtoRGB(hue2, 0.7f, 1.0f) | 0xFF000000;

        String brand = "NUVOXEL";
        String ver = "v" + NuvoxelClient.VERSION;
        int brandW = client.textRenderer.getWidth(brand);
        int verW = client.textRenderer.getWidth(ver);
        int totalW = brandW + verW + 16;

        context.fill(4, 4, 4 + totalW, 20, 0xC00F111A);

        for (int i = 0; i < totalW; i++) {
            float t = (float) i / totalW;
            int c = lerpColor(col1, col2, t);
            context.fill(4 + i, 4, 5 + i, 5, c);
        }

        context.fill(4, 4, 6, 20, col1);
        context.drawTextWithShadow(client.textRenderer, brand, 10, 8, col1);
        context.drawTextWithShadow(client.textRenderer, ver, 12 + brandW, 8, 0xFFA0A5B5);
    }

    private void renderActiveModules(DrawContext context, MinecraftClient client, int screenWidth, long time) {
        List<Module> enabled = NuvoxelClient.getModuleManager().getEnabledModules();
        enabled.sort((a, b) -> client.textRenderer.getWidth(b.getName()) - client.textRenderer.getWidth(a.getName()));

        int y = 4;
        for (int i = 0; i < enabled.size(); i++) {
            Module mod = enabled.get(i);
            String name = mod.getName();
            int textW = client.textRenderer.getWidth(name);
            int x = screenWidth - textW - 8;

            context.fill(x - 4, y, screenWidth - 2, y + 12, 0xB00D0E17);

            float hue = ((time + i * 220L) % 3600) / 3600f;
            int color = Color.HSBtoRGB(hue, 0.75f, 1.0f) | 0xFF000000;
            context.fill(screenWidth - 4, y, screenWidth - 2, y + 12, color);

            context.drawTextWithShadow(client.textRenderer, name, x - 1, y + 2, color);
            y += 13;
        }
    }

    private void renderCustomCrosshair(DrawContext context, int screenWidth, int screenHeight, long time) {
        int cx = screenWidth / 2;
        int cy = screenHeight / 2;
        int gap = 3;
        int length = 6;

        float hue = (time % 3000) / 3000f;
        int col = Color.HSBtoRGB(hue, 0.8f, 1.0f) | 0xFF000000;

        context.fill(cx, cy, cx + 1, cy + 1, col);
        context.fill(cx - gap - length, cy, cx - gap, cy + 1, col);
        context.fill(cx + gap + 1, cy, cx + gap + 1 + length, cy + 1, col);
        context.fill(cx, cy - gap - length, cx + 1, cy - gap, col);
        context.fill(cx, cy + gap + 1, cx + 1, cy + gap + 1 + length, col);
    }

    private void renderDirectionHud(DrawContext context, MinecraftClient client, int screenWidth) {
        if (client.player == null) return;
        float yaw = MathHelper.wrapDegrees(client.player.getYaw());
        String dir = "N";
        if (yaw >= -22.5 && yaw < 22.5) dir = "S";
        else if (yaw >= 22.5 && yaw < 67.5) dir = "SW";
        else if (yaw >= 67.5 && yaw < 112.5) dir = "W";
        else if (yaw >= 112.5 && yaw < 157.5) dir = "NW";
        else if (yaw >= 157.5 || yaw < -157.5) dir = "N";
        else if (yaw >= -157.5 && yaw < -112.5) dir = "NE";
        else if (yaw >= -112.5 && yaw < -67.5) dir = "E";
        else if (yaw >= -67.5 && yaw < -22.5) dir = "SE";

        String text = "[ " + dir + " ]  " + String.format("%.0f°", yaw);
        int w = client.textRenderer.getWidth(text);
        int x = (screenWidth - w) / 2;

        context.fill(x - 6, 4, x + w + 6, 17, 0xAA0D0E17);
        context.fill(x - 6, 4, x + w + 6, 5, 0xFF00E5FF);
        context.drawTextWithShadow(client.textRenderer, text, x, 7, 0xFF00E5FF);
    }

    private void renderKeystrokes(DrawContext context, MinecraftClient client, int screenHeight) {
        long window = client.getWindow().getHandle();
        boolean w = isKeyDown(window, GLFW.GLFW_KEY_W);
        boolean a = isKeyDown(window, GLFW.GLFW_KEY_A);
        boolean s = isKeyDown(window, GLFW.GLFW_KEY_S);
        boolean d = isKeyDown(window, GLFW.GLFW_KEY_D);
        boolean space = isKeyDown(window, GLFW.GLFW_KEY_SPACE);
        boolean lmb = client.mouse.wasLeftButtonClicked();
        boolean rmb = client.mouse.wasRightButtonClicked();

        int startX = 6;
        int startY = screenHeight - 110;
        int size = 18;

        drawKey(context, client, "W", startX + size + 2, startY, size, size, w);
        drawKey(context, client, "A", startX, startY + size + 2, size, size, a);
        drawKey(context, client, "S", startX + size + 2, startY + size + 2, size, size, s);
        drawKey(context, client, "D", startX + (size + 2) * 2, startY + size + 2, size, size, d);

        int mouseY = startY + (size + 2) * 2;
        int mouseW = (size * 3 + 4 - 2) / 2;
        drawKey(context, client, "LMB", startX, mouseY, mouseW, 14, lmb);
        drawKey(context, client, "RMB", startX + mouseW + 2, mouseY, mouseW, 14, rmb);

        int spaceY = mouseY + 16;
        int spaceW = size * 3 + 4;
        drawKey(context, client, "───────", startX, spaceY, spaceW, 12, space);
    }

    private void drawKey(DrawContext context, MinecraftClient client, String label, int x, int y, int w, int h, boolean pressed) {
        int bg = pressed ? 0xD000E5FF : 0xA00D0E17;
        int textCol = pressed ? 0xFF000000 : 0xFFFFFFFF;
        context.fill(x, y, x + w, y + h, bg);

        int textW = client.textRenderer.getWidth(label);
        int textX = x + (w - textW) / 2;
        int textY = y + (h - 8) / 2;
        context.drawTextWithShadow(client.textRenderer, label, textX, textY, textCol);
    }

    private void renderPlayerStats(DrawContext context, MinecraftClient client, int screenHeight) {
        if (client.player == null) return;
        float hp = client.player.getHealth();
        float maxHp = client.player.getMaxHealth();
        int food = client.player.getHungerManager().getFoodLevel();

        int y = screenHeight - 48;
        String text = String.format("HP: %.1f/%.0f  |  Food: %d", hp, maxHp, food);
        int w = client.textRenderer.getWidth(text);

        context.fill(4, y, 12 + w, y + 16, 0xCC0D0E17);
        float pct = MathHelper.clamp(hp / maxHp, 0f, 1f);
        int barW = (int) ((w + 8) * pct);
        int hpColor = pct > 0.5f ? 0xFF00E676 : (pct > 0.25f ? 0xFFFFD600 : 0xFFFF1744);
        context.fill(4, y + 14, 4 + barW, y + 16, hpColor);

        context.drawTextWithShadow(client.textRenderer, text, 8, y + 3, 0xFFFFFFFF);
    }

    private void renderArmorStatus(DrawContext context, MinecraftClient client, int screenWidth, int screenHeight) {
        if (client.player == null) return;
        int x = screenWidth / 2 + 95;
        int y = screenHeight - 55;

        Iterable<ItemStack> armorItems = client.player.getArmorItems();
        int offset = 0;
        for (ItemStack item : armorItems) {
            if (!item.isEmpty()) {
                context.drawItem(item, x + offset, y);
                if (item.isDamageable()) {
                    int dur = item.getMaxDamage() - item.getDamage();
                    String durText = String.valueOf(dur);
                    context.drawTextWithShadow(client.textRenderer, durText, x + offset + 2, y + 18, 0xFFFFFFFF);
                }
                offset += 24;
            }
        }
    }

    private void renderPotionDisplay(DrawContext context, MinecraftClient client, int screenHeight) {
        if (client.player == null) return;
        Collection<StatusEffectInstance> effects = client.player.getStatusEffects();
        if (effects.isEmpty()) return;

        int y = screenHeight / 2 - (effects.size() * 14) / 2;
        for (StatusEffectInstance effect : effects) {
            String name = effect.getEffectType().value().getName().getString();
            int durationSec = effect.getDuration() / 20;
            String text = String.format("%s (%02d:%02d)", name, durationSec / 60, durationSec % 60);

            int textW = client.textRenderer.getWidth(text);
            context.fill(2, y, 8 + textW, y + 13, 0xB00D0E17);
            context.fill(2, y, 4, y + 13, 0xFFAB47BC);
            context.drawTextWithShadow(client.textRenderer, text, 6, y + 2, 0xFFE1BEE7);
            y += 15;
        }
    }

    private void renderInfoOverlay(DrawContext context, MinecraftClient client, int screenHeight) {
        if (client.player == null) return;
        int y = screenHeight - 16;

        Module fpsMod = NuvoxelClient.getModuleManager().getModule("FPS");
        if (fpsMod != null && fpsMod.isEnabled()) {
            int fps = client.getCurrentFps();
            String fpsText = "§b" + fps + " §7FPS";
            context.drawTextWithShadow(client.textRenderer, fpsText, 4, y, 0xFFFFFFFF);
            y -= 12;
        }

        Module coordsMod = NuvoxelClient.getModuleManager().getModule("Coords");
        if (coordsMod != null && coordsMod.isEnabled()) {
            double x = client.player.getX();
            double yPos = client.player.getY();
            double z = client.player.getZ();

            boolean inNether = client.world != null && client.world.getRegistryKey().getValue().getPath().contains("nether");
            String coordsText = String.format("§7XYZ: §f%.1f / %.1f / %.1f", x, yPos, z);

            if (inNether) {
                coordsText += String.format(" §8(Overworld: %.0f, %.0f)", x * 8, z * 8);
            } else {
                coordsText += String.format(" §8(Nether: %.0f, %.0f)", x / 8, z / 8);
            }

            context.drawTextWithShadow(client.textRenderer, coordsText, 4, y, 0xFFFFFFFF);
        }
    }

    private boolean isKeyDown(long windowHandle, int keyCode) {
        if (windowHandle == 0) return false;
        return GLFW.glfwGetKey(windowHandle, keyCode) == GLFW.GLFW_PRESS;
    }

    private static int lerpColor(int c1, int c2, float t) {
        int a = (int) (((c1 >> 24) & 0xFF) + (((c2 >> 24) & 0xFF) - ((c1 >> 24) & 0xFF)) * t);
        int r = (int) (((c1 >> 16) & 0xFF) + (((c2 >> 16) & 0xFF) - ((c1 >> 16) & 0xFF)) * t);
        int g = (int) (((c1 >> 8) & 0xFF) + (((c2 >> 8) & 0xFF) - ((c1 >> 8) & 0xFF)) * t);
        int b = (int) ((c1 & 0xFF) + ((c2 & 0xFF) - (c1 & 0xFF)) * t);
        return (a << 24) | (r << 16) | (g << 8) | b;
    }
}
