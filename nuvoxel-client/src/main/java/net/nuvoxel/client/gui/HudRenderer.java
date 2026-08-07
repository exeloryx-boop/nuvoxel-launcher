package net.nuvoxel.client.gui;

import net.nuvoxel.client.core.Module;
import net.nuvoxel.client.core.ModuleManager;

import java.util.List;

/**
 * HUD Renderer — Manages periodic HUD status updates.
 */
public final class HudRenderer {

    private final ModuleManager moduleManager;
    private long lastHudUpdate = 0;

    public HudRenderer(ModuleManager moduleManager) {
        this.moduleManager = moduleManager;
    }

    /** Called every tick to update HUD elements. */
    public void onTick(Object client) {
        // HUD status is managed by individual HUD modules (FpsDisplay, CoordinatesDisplay, etc.)
        // The main HudRenderer handles the periodic status line
        long now = System.currentTimeMillis();
        if (now - lastHudUpdate > 60000) { // Every 60 seconds, show a subtle status
            lastHudUpdate = now;
            List<Module> enabled = moduleManager.getEnabledModules();
            if (!enabled.isEmpty()) {
                StringBuilder sb = new StringBuilder("§8[§b✦§8] §7Active: ");
                for (int i = 0; i < enabled.size(); i++) {
                    if (i > 0) sb.append("§8, ");
                    sb.append("§f").append(enabled.get(i).getName());
                }
                // Only log to console, don't spam chat
                System.out.println("[Nuvoxel HUD] " + enabled.size() + " modules active");
            }
        }
    }
}
