package net.nuvoxel.client.core;

/**
 * Module categories for the ClickGUI dropdown panels.
 * Each category has a display name, icon character, and accent color.
 */
public enum Category {
    VISUALS("Visuals", "✦", 0xFF00D4FF),     // Cyan
    HUD("HUD", "◈", 0xFF7C4DFF),            // Purple
    RENDER("Render", "◉", 0xFFFF6B9D),      // Pink
    WORLD("World", "◆", 0xFF00E676),         // Green
    MISC("Misc", "⚙", 0xFFFFAB40);          // Amber

    private final String displayName;
    private final String icon;
    private final int color;

    Category(String displayName, String icon, int color) {
        this.displayName = displayName;
        this.icon = icon;
        this.color = color;
    }

    public String getDisplayName() { return displayName; }
    public String getIcon() { return icon; }
    public int getColor() { return color; }
}
