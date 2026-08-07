package net.nuvoxel.client.modules.render;

import net.nuvoxel.client.core.Category;
import net.nuvoxel.client.core.Module;

/**
 * MotionBlur — Adds a cinematic motion blur effect to camera movement.
 * Adjustable intensity from subtle to dramatic.
 */
public class MotionBlur extends Module {

    private float intensity = 0.5f;

    public MotionBlur() {
        super("MotionBlur", "Cinematic motion blur effect on camera movement", Category.RENDER);
    }

    public float getIntensity() { return intensity; }
    public void setIntensity(float intensity) { this.intensity = Math.max(0, Math.min(1, intensity)); }

    @Override
    protected void onEnable() {
        System.out.println("[Nuvoxel] Motion Blur enabled — intensity: " + (int)(intensity * 100) + "%");
    }

    @Override
    protected void onDisable() {
        System.out.println("[Nuvoxel] Motion Blur disabled");
    }
}
