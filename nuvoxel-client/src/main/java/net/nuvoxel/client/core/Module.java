package net.nuvoxel.client.core;

import net.minecraft.client.MinecraftClient;

/**
 * Represents a single visual module/feature in Nuvoxel Client.
 * Modules are organized into categories and can be toggled via ClickGUI.
 */
public abstract class Module {
    private final String name;
    private final String description;
    private final Category category;
    private boolean enabled;
    private int keybind; // GLFW key code, 0 = none

    public Module(String name, String description, Category category) {
        this(name, description, category, false, 0);
    }

    public Module(String name, String description, Category category, boolean enabledByDefault, int keybind) {
        this.name = name;
        this.description = description;
        this.category = category;
        this.enabled = enabledByDefault;
        this.keybind = keybind;
    }

    public String getName() { return name; }
    public String getDescription() { return description; }
    public Category getCategory() { return category; }
    public boolean isEnabled() { return enabled; }
    public int getKeybind() { return keybind; }
    public void setKeybind(int keybind) { this.keybind = keybind; }

    public void toggle() {
        enabled = !enabled;
        if (enabled) onEnable();
        else onDisable();
    }

    public void setEnabled(boolean state) {
        if (this.enabled != state) toggle();
    }

    /** Called when the module is toggled on. */
    protected void onEnable() {}

    /** Called when the module is toggled off. */
    protected void onDisable() {}

    /** Called every game tick (~20 times per second) while enabled. */
    public void onTick(MinecraftClient client) {}

    /** Visual modules can override to provide a color for the HUD list. */
    public int getColor() {
        return category.getColor();
    }
}
