package net.nuvoxel.client.modules.hud;

import net.nuvoxel.client.core.Category;
import net.nuvoxel.client.core.Module;

/**
 * Watermark — Shows the Nuvoxel Client watermark on the HUD.
 * Displays "Nuvoxel Client v0.2.0-beta" with a gradient effect.
 */
public class Watermark extends Module {

    public Watermark() {
        super("Watermark", "Show Nuvoxel Client branding on screen", Category.HUD, true, 0);
    }

    @Override
    protected void onEnable() {
        System.out.println("[Nuvoxel] Watermark enabled — branding visible");
    }

    @Override
    protected void onDisable() {
        System.out.println("[Nuvoxel] Watermark disabled");
    }
}
