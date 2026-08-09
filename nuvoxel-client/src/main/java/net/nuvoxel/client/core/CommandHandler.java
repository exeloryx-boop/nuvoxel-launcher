package net.nuvoxel.client.core;

import net.minecraft.client.MinecraftClient;
import net.nuvoxel.client.NuvoxelClient;

import java.util.List;

/**
 * Handles client-side chat commands starting with '.' (Lunar / LabyMod style).
 * Examples:
 *   .config save pvp
 *   .config load pvp
 *   .config list
 *   .toggle Fullbright
 *   .help
 */
public final class CommandHandler {

    public static boolean execute(String text) {
        if (text == null || !text.startsWith(".")) {
            return false;
        }

        String command = text.substring(1).trim();
        String[] parts = command.split("\\s+");
        if (parts.length == 0 || parts[0].isEmpty()) {
            return false;
        }

        String label = parts[0].toLowerCase();

        switch (label) {
            case "config":
                handleConfigCommand(parts);
                return true;

            case "toggle":
            case "t":
                if (parts.length > 1) {
                    String modName = parts[1];
                    Module mod = NuvoxelClient.getModuleManager().getModule(modName);
                    if (mod != null) {
                        mod.toggle();
                        NuvoxelClient.showChatMessage(
                                MinecraftClient.getInstance(),
                                "§b[Nuvoxel] §7Module §e" + mod.getName() + " §7is now " +
                                        (mod.isEnabled() ? "§a§lENABLED" : "§c§lDISABLED")
                        );
                    } else {
                        NuvoxelClient.showChatMessage(
                                MinecraftClient.getInstance(),
                                "§c[Nuvoxel] Module '" + modName + "' not found! Use .modules to list."
                        );
                    }
                } else {
                    NuvoxelClient.showChatMessage(MinecraftClient.getInstance(), "§cUsage: .toggle <module_name>");
                }
                return true;

            case "modules":
            case "mods":
                List<Module> modules = NuvoxelClient.getModuleManager().getModules();
                StringBuilder sb = new StringBuilder("§b[Nuvoxel] §7Visual Modules (").append(modules.size()).append("):\n");
                for (Module m : modules) {
                    sb.append(m.isEnabled() ? "§a" : "§7").append(m.getName()).append("§r, ");
                }
                NuvoxelClient.showChatMessage(MinecraftClient.getInstance(), sb.toString());
                return true;

            case "help":
                NuvoxelClient.showChatMessage(MinecraftClient.getInstance(), "§b§l═══ NUVOXEL CLIENT COMMANDS ═══");
                NuvoxelClient.showChatMessage(MinecraftClient.getInstance(), "§e.config save <name> §7— Save current visual setup");
                NuvoxelClient.showChatMessage(MinecraftClient.getInstance(), "§e.config load <name> §7— Load a saved setup");
                NuvoxelClient.showChatMessage(MinecraftClient.getInstance(), "§e.config list §7— List all saved configs");
                NuvoxelClient.showChatMessage(MinecraftClient.getInstance(), "§e.toggle <module> §7— Enable/Disable a module");
                NuvoxelClient.showChatMessage(MinecraftClient.getInstance(), "§e.modules §7— List all visual modules");
                NuvoxelClient.showChatMessage(MinecraftClient.getInstance(), "§7Press §eRSHIFT §7to open ClickGUI");
                return true;

            default:
                return false;
        }
    }

    private static void handleConfigCommand(String[] parts) {
        MinecraftClient mc = MinecraftClient.getInstance();

        if (parts.length < 2) {
            NuvoxelClient.showChatMessage(mc, "§b[Nuvoxel Config] §7Subcommands: §esave, load, list, default");
            return;
        }

        String action = parts[1].toLowerCase();

        switch (action) {
            case "save":
                String saveName = parts.length > 2 ? parts[2] : "default";
                boolean saved = ConfigManager.saveConfig(saveName);
                if (saved) {
                    NuvoxelClient.showChatMessage(mc, "§b[Nuvoxel Config] §aSuccessfully saved config §e'" + saveName + "'§a!");
                } else {
                    NuvoxelClient.showChatMessage(mc, "§c[Nuvoxel Config] Failed to save config!");
                }
                break;

            case "load":
                String loadName = parts.length > 2 ? parts[2] : "default";
                boolean loaded = ConfigManager.loadConfig(loadName);
                if (loaded) {
                    NuvoxelClient.showChatMessage(mc, "§b[Nuvoxel Config] §aSuccessfully loaded config §e'" + loadName + "'§a!");
                } else {
                    NuvoxelClient.showChatMessage(mc, "§c[Nuvoxel Config] Config '" + loadName + "' not found!");
                }
                break;

            case "list":
                List<String> configs = ConfigManager.listConfigs();
                if (configs.isEmpty()) {
                    NuvoxelClient.showChatMessage(mc, "§b[Nuvoxel Config] §7No saved configs found.");
                } else {
                    NuvoxelClient.showChatMessage(mc, "§b[Nuvoxel Config] §7Saved presets: §e" + String.join(", ", configs));
                }
                break;

            case "default":
                ConfigManager.saveConfig("default");
                NuvoxelClient.showChatMessage(mc, "§b[Nuvoxel Config] §aReset to default configuration!");
                break;

            default:
                NuvoxelClient.showChatMessage(mc, "§cUnknown config subcommand. Use: save, load, list, default");
                break;
        }
    }
}
