package net.nuvoxel.client.modules.visuals;

import net.minecraft.client.MinecraftClient;
import net.minecraft.util.Hand;
import net.nuvoxel.client.core.Category;
import net.nuvoxel.client.core.Module;

/**
 * Animations — Smooth 1.7-style swing animations and hand swing effect.
 */
public class Animations extends Module {

    public Animations() {
        super("Animations", "Smooth 1.7-style item swing animations", Category.VISUALS, true, 0);
    }

    @Override
    public void onTick(MinecraftClient client) {
        if (client.player == null) return;

        try {
            if (client.player.handSwinging && client.player.handSwingProgress < 0.2f) {
                client.player.swingHand(Hand.MAIN_HAND, true);
            }
        } catch (Throwable ignored) {}
    }
}
