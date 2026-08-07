package net.nuvoxel.client.modules.world;

import net.nuvoxel.client.core.Category;
import net.nuvoxel.client.core.Module;

/**
 * FogControl — Adjust or remove distance fog for clearer visibility.
 * Can set custom fog color for aesthetic effects.
 */
public class FogControl extends Module {

    private boolean removeFog = true;
    private int fogColor = 0xFF0A0A1A; // Dark blue
    private float fogDistance = 1000f;

    public FogControl() {
        super("FogControl", "Control or remove distance fog for clearer visuals", Category.WORLD);
    }

    public boolean isRemoveFog() { return removeFog; }
    public int getFogColor() { return fogColor; }
    public float getFogDistance() { return fogDistance; }

    @Override
    protected void onEnable() {
        System.out.println("[Nuvoxel] Fog Control enabled — " + (removeFog ? "fog removed" : "custom fog"));
    }

    @Override
    protected void onDisable() {
        System.out.println("[Nuvoxel] Fog Control disabled — default fog restored");
    }
}
