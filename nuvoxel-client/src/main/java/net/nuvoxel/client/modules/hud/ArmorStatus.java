package net.nuvoxel.client.modules.hud;

import net.nuvoxel.client.core.Category;
import net.nuvoxel.client.core.Module;

/**
 * ArmorStatus — Shows current armor durability and equipped items.
 */
public class ArmorStatus extends Module {

    public ArmorStatus() {
        super("ArmorHUD", "Display equipped armor durability", Category.HUD);
    }

    @Override
    protected void onEnable() {
        System.out.println("[Nuvoxel] Armor Status HUD enabled");
    }

    @Override
    protected void onDisable() {
        System.out.println("[Nuvoxel] Armor Status HUD disabled");
    }
}
