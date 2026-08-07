package net.nuvoxel.client.modules.visuals;

import net.minecraft.client.MinecraftClient;
import net.minecraft.particle.ParticleTypes;
import net.nuvoxel.client.core.Category;
import net.nuvoxel.client.core.Module;

import java.util.Random;

/**
 * Particles — Spawns vibrant end rod and portal particles around the player.
 */
public class Particles extends Module {

    private final Random random = new Random();

    public Particles() {
        super("Particles", "Spawns vibrant ambient particle trail around player", Category.VISUALS, true, 0);
    }

    @Override
    public void onTick(MinecraftClient client) {
        if (client.player == null || client.world == null) return;

        try {
            double px = client.player.getX() + (random.nextDouble() - 0.5) * 1.5;
            double py = client.player.getY() + random.nextDouble() * 2.0;
            double pz = client.player.getZ() + (random.nextDouble() - 0.5) * 1.5;

            client.world.addParticle(ParticleTypes.END_ROD, px, py, pz, 0.0, 0.02, 0.0);
        } catch (Throwable ignored) {}
    }
}
