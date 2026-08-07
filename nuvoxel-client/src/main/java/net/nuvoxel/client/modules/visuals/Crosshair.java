package net.nuvoxel.client.modules.visuals;

import net.nuvoxel.client.core.Category;
import net.nuvoxel.client.core.Module;

/**
 * Crosshair — Custom crosshair styles with dynamic coloring
 * that responds to what the player is looking at.
 */
public class Crosshair extends Module {

    public enum Style { DOT, CIRCLE, CROSS, DIAMOND }

    private Style style = Style.CROSS;
    private boolean dynamic = true;
    private int color = 0xFFFFFFFF;

    public Crosshair() {
        super("Crosshair", "Custom crosshair with dynamic color and multiple styles", Category.VISUALS);
    }

    public Style getStyle() { return style; }
    public void setStyle(Style style) { this.style = style; }
    public boolean isDynamic() { return dynamic; }
    public int getColor() { return color; }

    @Override
    protected void onEnable() {
        System.out.println("[Nuvoxel] Custom Crosshair enabled — style: " + style.name());
    }

    @Override
    protected void onDisable() {
        System.out.println("[Nuvoxel] Custom Crosshair disabled");
    }
}
