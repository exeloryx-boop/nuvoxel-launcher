package net.nuvoxel.client.modules.hud;

import net.minecraft.client.MinecraftClient;
import net.nuvoxel.client.core.Category;
import net.nuvoxel.client.core.Module;

/**
 * FPS Display — Tracks FPS count for HUD rendering by InGameHudMixin.
 * No longer uses reflection; the mixin reads FPS directly.
 */
public class FpsDisplay extends Module {

    public FpsDisplay() {
        super("FPS", "Display current frames per second", Category.HUD, true, 0);
    }

    @Override
    protected void onEnable() {
        System.out.println("[Nuvoxel] FPS Display enabled");
    }

    @Override
    public void onTick(MinecraftClient client) {
        // FPS is read directly by InGameHudMixin via client.getCurrentFps()
        // No action needed in tick — this module just acts as a toggle
    }
}
