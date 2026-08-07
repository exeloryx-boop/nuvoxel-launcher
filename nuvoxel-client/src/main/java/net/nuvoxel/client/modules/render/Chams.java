package net.nuvoxel.client.modules.render;

import net.minecraft.client.MinecraftClient;
import net.minecraft.entity.Entity;
import net.nuvoxel.client.core.Category;
import net.nuvoxel.client.core.Module;

/**
 * Chams / Glow ESP — Highlights entities through walls with a colorful glow aura.
 */
public class Chams extends Module {

    public Chams() {
        super("Chams", "Highlights surrounding entities with a glowing aura", Category.RENDER, false, 0);
    }

    @Override
    public void onTick(MinecraftClient client) {
        if (client.world == null || client.player == null) return;

        try {
            for (Entity entity : client.world.getEntities()) {
                if (entity != client.player) {
                    entity.setGlowing(true);
                }
            }
        } catch (Throwable ignored) {}
    }

    @Override
    protected void onDisable() {
        MinecraftClient client = MinecraftClient.getInstance();
        if (client.world == null) return;

        try {
            for (Entity entity : client.world.getEntities()) {
                if (entity != client.player) {
                    entity.setGlowing(false);
                }
            }
        } catch (Throwable ignored) {}
    }
}
