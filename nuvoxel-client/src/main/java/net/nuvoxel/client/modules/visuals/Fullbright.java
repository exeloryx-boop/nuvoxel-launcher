package net.nuvoxel.client.modules.visuals;

import net.minecraft.client.MinecraftClient;
import net.minecraft.entity.effect.StatusEffectInstance;
import net.minecraft.entity.effect.StatusEffects;
import net.nuvoxel.client.core.Category;
import net.nuvoxel.client.core.Module;

/**
 * Fullbright — Maximum brightness in dark areas via Gamma options & Night Vision.
 */
public class Fullbright extends Module {

    public Fullbright() {
        super("Fullbright", "Maximum brightness for clear visibility in dark areas", Category.VISUALS, true, 72); // H key
    }

    @Override
    protected void onEnable() {
        MinecraftClient client = MinecraftClient.getInstance();
        if (client.options != null) {
            try {
                client.options.getGamma().setValue(100.0);
            } catch (Throwable ignored) {}
        }
    }

    @Override
    protected void onDisable() {
        MinecraftClient client = MinecraftClient.getInstance();
        if (client.options != null) {
            try {
                client.options.getGamma().setValue(1.0);
            } catch (Throwable ignored) {}
        }
        if (client.player != null) {
            try {
                client.player.removeStatusEffect(StatusEffects.NIGHT_VISION);
            } catch (Throwable ignored) {}
        }
    }

    @Override
    public void onTick(MinecraftClient client) {
        if (client.options != null) {
            try {
                if (client.options.getGamma().getValue() < 10.0) {
                    client.options.getGamma().setValue(100.0);
                }
            } catch (Throwable ignored) {}
        }
        if (client.player != null) {
            try {
                // Client-side visual Night Vision without particles
                client.player.addStatusEffect(new StatusEffectInstance(StatusEffects.NIGHT_VISION, 300, 0, false, false, false));
            } catch (Throwable ignored) {}
        }
    }
}
