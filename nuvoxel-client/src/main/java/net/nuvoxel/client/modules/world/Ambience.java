package net.nuvoxel.client.modules.world;

import net.minecraft.client.MinecraftClient;
import net.minecraft.particle.ParticleTypes;
import net.nuvoxel.client.core.Category;
import net.nuvoxel.client.core.Module;

import java.util.Random;

/**
 * Ambience — Atmospheric cherry leaves and glow particles floating around screen.
 */
public class Ambience extends Module {

    private final Random random = new Random();

    public Ambience() {
        super("Ambience", "Atmospheric cherry leaves and ambient particle aura", Category.WORLD, true, 0);
    }

    @Override
    public void onTick(MinecraftClient client) {
        if (client.player == null || client.world == null) return;

        try {
            double px = client.player.getX() + (random.nextDouble() - 0.5) * 4.0;
            double py = client.player.getY() + random.nextDouble() * 3.0;
            double pz = client.player.getZ() + (random.nextDouble() - 0.5) * 4.0;

            client.world.addParticle(ParticleTypes.CHERRY_LEAVES, px, py, pz, 0.01, -0.01, 0.01);
            if (random.nextInt(3) == 0) {
                client.world.addParticle(ParticleTypes.GLOW_SQUID_INK, px, py, pz, 0, 0.03, 0);
            }
        } catch (Throwable ignored) {}
    }
}
