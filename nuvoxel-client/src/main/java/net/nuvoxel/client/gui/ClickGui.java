package net.nuvoxel.client.gui;

import net.minecraft.client.MinecraftClient;
import net.nuvoxel.client.NuvoxelClient;
import net.nuvoxel.client.core.Category;
import net.nuvoxel.client.core.Module;
import net.nuvoxel.client.core.ModuleManager;
import net.nuvoxel.client.core.ReflectionBridge;

import java.util.*;

/**
 * ClickGUI controller with RSHIFT keybind.
 * Opens ScreenClickGui on screen for full interactive visual controls,
 * and falls back to chat info if GUI screen cannot open.
 */
public final class ClickGui {

    private static final int OPEN_KEY = 344; // GLFW_KEY_RIGHT_SHIFT

    private final ModuleManager moduleManager;
    private boolean open = false;
    private boolean wasKeyDown = false;
    private long lastToggleTime = 0;

    public ClickGui(ModuleManager moduleManager) {
        this.moduleManager = moduleManager;
    }

    public boolean isOpen() { return open; }

    /** Check keybind for RSHIFT to open/close ClickGUI. */
    public void checkKeybind(Object client) {
        boolean keyDown = ReflectionBridge.isKeyDown(OPEN_KEY);

        if (keyDown && !wasKeyDown) {
            long now = System.currentTimeMillis();
            if (now - lastToggleTime > 250) { // Debounce
                lastToggleTime = now;
                toggle(client);
            }
        }
        wasKeyDown = keyDown;
    }

    private void toggle(Object client) {
        open = !open;

        if (open) {
            try {
                MinecraftClient mc = MinecraftClient.getInstance();
                mc.execute(() -> mc.setScreen(new ScreenClickGui(moduleManager)));
            } catch (Throwable e) {
                showGuiInfo(client);
            }
        } else {
            try {
                MinecraftClient mc = MinecraftClient.getInstance();
                if (mc.currentScreen instanceof ScreenClickGui) {
                    mc.execute(() -> mc.setScreen(null));
                }
            } catch (Throwable ignored) {}
            NuvoxelClient.showChatMessage(client, "§b§l[Nuvoxel] §7ClickGUI closed");
        }
    }

    public void showGuiInfo(Object client) {
        NuvoxelClient.showChatMessage(client, "");
        NuvoxelClient.showChatMessage(client, "§b§l╔══════════════════════════════════╗");
        NuvoxelClient.showChatMessage(client, "§b§l║   §f§l✦ NUVOXEL CLIENT §7v" + NuvoxelClient.VERSION + "§b§l         ║");
        NuvoxelClient.showChatMessage(client, "§b§l╠══════════════════════════════════╣");
        NuvoxelClient.showChatMessage(client, "§b§l║ §r§7Visual Enhancement Mod          §b§l║");
        NuvoxelClient.showChatMessage(client, "§b§l╠══════════════════════════════════╣");

        for (Category cat : Category.values()) {
            List<Module> mods = moduleManager.getModules(cat);
            String catColor = getCategoryColor(cat);
            NuvoxelClient.showChatMessage(client,
                "§b§l║ " + catColor + "§l" + cat.getIcon() + " " + cat.getDisplayName().toUpperCase() + "§r");

            for (Module mod : mods) {
                String status = mod.isEnabled() ? "§a§lON " : "§c§lOFF";
                String keybindStr = mod.getKeybind() != 0
                    ? " §8[§7" + getKeyName(mod.getKeybind()) + "§8]"
                    : "";
                NuvoxelClient.showChatMessage(client,
                    "§b§l║   " + status + " §r§f" + mod.getName() + keybindStr);
            }
            NuvoxelClient.showChatMessage(client, "§b§l║");
        }

        NuvoxelClient.showChatMessage(client, "§b§l╠══════════════════════════════════╣");
        NuvoxelClient.showChatMessage(client, "§b§l║ §r§7Press §eRSHIFT§7 for visual GUI  §b§l║");
        NuvoxelClient.showChatMessage(client, "§b§l╚══════════════════════════════════╝");
        NuvoxelClient.showChatMessage(client, "");
    }

    private String getCategoryColor(Category cat) {
        switch (cat) {
            case VISUALS: return "§b";
            case HUD:     return "§d";
            case RENDER:  return "§c";
            case WORLD:   return "§a";
            case MISC:    return "§6";
            default:      return "§f";
        }
    }

    private String getKeyName(int keyCode) {
        switch (keyCode) {
            case 67:  return "C";
            case 70:  return "F";
            case 72:  return "H";
            case 80:  return "P";
            case 86:  return "V";
            case 90:  return "Z";
            case 340: return "LSHIFT";
            case 344: return "RSHIFT";
            default:  return "KEY_" + keyCode;
        }
    }
}
