package net.nuvoxel.client.modules.hud;

import net.minecraft.client.MinecraftClient;
import net.nuvoxel.client.core.Category;
import net.nuvoxel.client.core.Module;

/**
 * Coordinates Display — Enables the coordinate overlay on the HUD.
 * Rendered by InGameHudMixin when this module is enabled.
 */
public class CoordinatesDisplay extends Module {

    public CoordinatesDisplay() {
        super("Coords", "Display player coordinates", Category.HUD, false, 0);
    }

    @Override
    protected void onEnable() {
        System.out.println("[Nuvoxel] Coordinates display enabled");
    }

    @Override
    public void onTick(MinecraftClient client) {
        // Coordinates are rendered directly by InGameHudMixin
        // This module just acts as a toggle
    }
}
