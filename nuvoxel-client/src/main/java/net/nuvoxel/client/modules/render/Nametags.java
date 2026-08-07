package net.nuvoxel.client.modules.render;

import net.nuvoxel.client.core.Category;
import net.nuvoxel.client.core.Module;

/**
 * Nametags — Enhanced nametag rendering with larger text, health bars,
 * distance display, and background styling.
 */
public class Nametags extends Module {

    private boolean showHealth = true;
    private boolean showDistance = true;
    private float scale = 1.5f;
    private boolean background = true;

    public Nametags() {
        super("Nametags", "Enhanced nametags with health, distance and styling", Category.RENDER);
    }

    public boolean isShowHealth() { return showHealth; }
    public boolean isShowDistance() { return showDistance; }
    public float getScale() { return scale; }
    public boolean hasBackground() { return background; }

    @Override
    protected void onEnable() {
        System.out.println("[Nuvoxel] Enhanced Nametags enabled — scale: " + scale + "x");
    }

    @Override
    protected void onDisable() {
        System.out.println("[Nuvoxel] Enhanced Nametags disabled");
    }
}
