package net.nuvoxel.client.modules.hud;

import net.minecraft.client.MinecraftClient;
import net.nuvoxel.client.core.Category;
import net.nuvoxel.client.core.Module;

/**
 * Clock — Shows in-game time in a readable format.
 * Rendered by InGameHudMixin, not via reflection.
 */
public class Clock extends Module {

    private String currentTime = "00:00";

    public Clock() {
        super("Clock", "Display in-game time as a clock", Category.HUD);
    }

    public String getCurrentTime() { return currentTime; }

    @Override
    public void onTick(MinecraftClient client) {
        if (client.world == null) return;
        try {
            long time = client.world.getTimeOfDay() % 24000;
            int hours = (int) ((time / 1000 + 6) % 24);
            int minutes = (int) ((time % 1000) * 60 / 1000);
            currentTime = String.format("%02d:%02d", hours, minutes);
        } catch (Throwable ignored) {}
    }
}
