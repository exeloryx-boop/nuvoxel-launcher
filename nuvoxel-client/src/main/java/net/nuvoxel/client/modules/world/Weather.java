package net.nuvoxel.client.modules.world;

import net.minecraft.client.MinecraftClient;
import net.nuvoxel.client.core.Category;
import net.nuvoxel.client.core.Module;

/**
 * Weather — Visually toggle client rain and storm effects.
 */
public class Weather extends Module {

    public enum WeatherMode { CLEAR, RAIN }
    private WeatherMode mode = WeatherMode.RAIN;

    public Weather() {
        super("Weather", "Toggle visual client rain and atmospheric weather", Category.WORLD, false, 0);
    }

    @Override
    public void onTick(MinecraftClient client) {
        if (client.world == null) return;

        try {
            client.world.setRainGradient(mode == WeatherMode.RAIN ? 1.0f : 0.0f);
        } catch (Throwable ignored) {}
    }

    @Override
    protected void onDisable() {
        MinecraftClient client = MinecraftClient.getInstance();
        if (client.world == null) return;

        try {
            client.world.setRainGradient(0.0f);
        } catch (Throwable ignored) {}
    }
}
