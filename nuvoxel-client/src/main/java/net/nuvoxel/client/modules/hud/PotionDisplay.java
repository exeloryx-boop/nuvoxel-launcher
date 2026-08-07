package net.nuvoxel.client.modules.hud;

import net.nuvoxel.client.core.Category;
import net.nuvoxel.client.core.Module;

/**
 * PotionDisplay — Shows active potion effects with remaining duration.
 */
public class PotionDisplay extends Module {

    public PotionDisplay() {
        super("Potions", "Display active potion effects with timers", Category.HUD);
    }

    @Override
    protected void onEnable() {
        System.out.println("[Nuvoxel] Potion Display enabled");
    }

    @Override
    protected void onDisable() {
        System.out.println("[Nuvoxel] Potion Display disabled");
    }
}
