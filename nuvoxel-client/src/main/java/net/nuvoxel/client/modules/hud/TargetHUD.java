package net.nuvoxel.client.modules.hud;

import net.nuvoxel.client.core.Category;
import net.nuvoxel.client.core.Module;

/**
 * TargetHUD / PlayerStats — Displays player health, hunger, and speed status overlay.
 */
public class TargetHUD extends Module {

    public TargetHUD() {
        super("PlayerStats", "Renders health, hunger, and speed stats on HUD", Category.HUD, true, 0);
    }
}
