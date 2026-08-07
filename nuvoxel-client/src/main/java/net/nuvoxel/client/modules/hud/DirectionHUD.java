package net.nuvoxel.client.modules.hud;

import net.nuvoxel.client.core.Category;
import net.nuvoxel.client.core.Module;

/**
 * DirectionHUD — Shows N, S, E, W compass direction bar on screen.
 */
public class DirectionHUD extends Module {

    public DirectionHUD() {
        super("DirectionHUD", "Renders compass direction on top of screen", Category.HUD, true, 0);
    }
}
