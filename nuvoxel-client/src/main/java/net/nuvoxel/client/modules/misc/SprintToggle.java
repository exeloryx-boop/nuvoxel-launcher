package net.nuvoxel.client.modules.misc;

import net.minecraft.client.MinecraftClient;
import net.nuvoxel.client.core.Category;
import net.nuvoxel.client.core.Module;

/**
 * SprintToggle — Automatic sprinting whenever player moves forward.
 */
public class SprintToggle extends Module {

    public SprintToggle() {
        super("Sprint", "Automatically sprint when moving forward (Key V)", Category.MISC, true, 86); // V key
    }

    @Override
    public void onTick(MinecraftClient client) {
        if (client.player == null || client.options == null) return;

        try {
            if (client.options.forwardKey.isPressed() && !client.player.isSneaking() && !client.player.horizontalCollision) {
                client.player.setSprinting(true);
            }
        } catch (Throwable ignored) {}
    }
}
