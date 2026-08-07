package net.nuvoxel.client.modules.misc;

import net.minecraft.client.MinecraftClient;
import net.nuvoxel.client.core.Category;
import net.nuvoxel.client.core.Module;
import org.lwjgl.glfw.GLFW;

/**
 * ZoomModule — Optifine-like smooth FOV zoom when pressing key Z or C.
 */
public class ZoomModule extends Module {

    private int originalFov = 70;
    private boolean zoomed = false;

    public ZoomModule() {
        super("Zoom", "Optifine-like smooth FOV camera zoom (Key C / Z)", Category.MISC, true, 0);
        // keybind = 0 because we handle Z/C manually as hold-to-zoom
    }

    @Override
    public void onTick(MinecraftClient client) {
        if (client.options == null || client.getWindow() == null) return;

        long window = client.getWindow().getHandle();
        if (window == 0) return;

        boolean zPressed = GLFW.glfwGetKey(window, GLFW.GLFW_KEY_Z) == GLFW.GLFW_PRESS
                || GLFW.glfwGetKey(window, GLFW.GLFW_KEY_C) == GLFW.GLFW_PRESS;

        try {
            if (zPressed && client.currentScreen == null) {
                if (!zoomed) {
                    originalFov = client.options.getFov().getValue();
                    zoomed = true;
                }
                client.options.getFov().setValue(30);
            } else if (zoomed) {
                client.options.getFov().setValue(originalFov);
                zoomed = false;
            }
        } catch (Throwable ignored) {}
    }

    @Override
    protected void onDisable() {
        MinecraftClient client = MinecraftClient.getInstance();
        if (zoomed && client.options != null) {
            try {
                client.options.getFov().setValue(originalFov);
            } catch (Throwable ignored) {}
            zoomed = false;
        }
    }
}
