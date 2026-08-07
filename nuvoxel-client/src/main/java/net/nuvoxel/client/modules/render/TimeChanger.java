package net.nuvoxel.client.modules.render;

import net.minecraft.client.MinecraftClient;
import net.nuvoxel.client.core.Category;
import net.nuvoxel.client.core.Module;

/**
 * TimeChanger — Override visual client time of day to Day/Sunset/Night.
 * Uses client-side time override for visual effect only.
 */
public class TimeChanger extends Module {

    public enum TimePreset {
        DAY(6000L), SUNSET(12500L), NIGHT(18000L), MIDNIGHT(0L);
        public final long time;
        TimePreset(long time) { this.time = time; }
    }

    private TimePreset preset = TimePreset.DAY;

    public TimeChanger() {
        super("TimeChanger", "Visually override game time (Day/Sunset/Night) (Key P)", Category.RENDER, false, 80); // P key
    }

    @Override
    public void onTick(MinecraftClient client) {
        if (client.world == null) return;
        try {
            // Use the proper Yarn-mapped method for setting client-side time
            client.world.setTimeOfDay(preset.time);
        } catch (Throwable ignored) {}
    }

    public void cyclePreset() {
        TimePreset[] values = TimePreset.values();
        preset = values[(preset.ordinal() + 1) % values.length];
    }

    public TimePreset getPreset() { return preset; }
}
