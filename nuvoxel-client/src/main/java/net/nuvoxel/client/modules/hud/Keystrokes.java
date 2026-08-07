package net.nuvoxel.client.modules.hud;

import net.nuvoxel.client.core.Category;
import net.nuvoxel.client.core.Module;

/**
 * Keystrokes — Displays WASD + Mouse buttons and CPS on HUD.
 */
public class Keystrokes extends Module {

    public Keystrokes() {
        super("Keystrokes", "Display WASD keys and mouse buttons on screen", Category.HUD, true, 0);
    }
}
