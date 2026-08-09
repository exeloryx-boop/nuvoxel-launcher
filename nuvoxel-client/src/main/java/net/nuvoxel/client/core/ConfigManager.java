package net.nuvoxel.client.core;

import net.minecraft.client.MinecraftClient;
import net.nuvoxel.client.NuvoxelClient;

import java.io.File;
import java.io.FileWriter;
import java.nio.file.Files;
import java.util.ArrayList;
import java.util.List;

/**
 * Powerful Config Manager for Nuvoxel Client (Lunar / LabyMod style).
 * Manages saving and loading custom module presets to .minecraft/nuvoxel/configs/
 */
public final class ConfigManager {

    private static final String CONFIG_DIR_NAME = "nuvoxel/configs";
    private static File configDir;

    public static void init() {
        try {
            File runDir = MinecraftClient.getInstance().runDirectory;
            configDir = new File(runDir, CONFIG_DIR_NAME);
            if (!configDir.exists()) {
                configDir.mkdirs();
            }
            // Auto load default config if exists
            loadConfig("default");
        } catch (Throwable e) {
            System.err.println("[Nuvoxel Config] Failed to initialize ConfigManager: " + e.getMessage());
        }
    }

    public static boolean saveConfig(String name) {
        if (name == null || name.trim().isEmpty()) name = "default";
        name = sanitizeName(name);

        try {
            if (configDir == null || !configDir.exists()) {
                init();
            }
            File configFile = new File(configDir, name + ".json");
            StringBuilder json = new StringBuilder();
            json.append("{\n");
            json.append("  \"version\": \"").append(NuvoxelClient.VERSION).append("\",\n");
            json.append("  \"savedAt\": ").append(System.currentTimeMillis()).append(",\n");
            json.append("  \"modules\": {\n");

            List<Module> modules = NuvoxelClient.getModuleManager().getModules();
            for (int i = 0; i < modules.size(); i++) {
                Module m = modules.get(i);
                json.append("    \"").append(m.getName()).append("\": {\n");
                json.append("      \"enabled\": ").append(m.isEnabled()).append(",\n");
                json.append("      \"keybind\": ").append(m.getKeybind()).append("\n");
                json.append("    }").append(i < modules.size() - 1 ? "," : "").append("\n");
            }
            json.append("  }\n");
            json.append("}\n");

            try (FileWriter writer = new FileWriter(configFile)) {
                writer.write(json.toString());
            }

            System.out.println("[Nuvoxel Config] Saved config: " + configFile.getAbsolutePath());
            return true;
        } catch (Throwable e) {
            System.err.println("[Nuvoxel Config] Error saving config: " + e.getMessage());
            return false;
        }
    }

    public static boolean loadConfig(String name) {
        if (name == null || name.trim().isEmpty()) name = "default";
        name = sanitizeName(name);

        try {
            if (configDir == null) init();
            File configFile = new File(configDir, name + ".json");
            if (!configFile.exists()) {
                return false;
            }

            String content = Files.readString(configFile.toPath());
            List<Module> modules = NuvoxelClient.getModuleManager().getModules();

            for (Module m : modules) {
                String key = "\"" + m.getName() + "\":";
                int idx = content.indexOf(key);
                if (idx != -1) {
                    int enabledIdx = content.indexOf("\"enabled\":", idx);
                    if (enabledIdx != -1) {
                        int commaIdx = content.indexOf(",", enabledIdx);
                        if (commaIdx != -1) {
                            String val = content.substring(enabledIdx + 10, commaIdx).trim();
                            boolean enabled = Boolean.parseBoolean(val);
                            if (enabled != m.isEnabled()) {
                                m.setEnabled(enabled);
                            }
                        }
                    }
                }
            }

            System.out.println("[Nuvoxel Config] Loaded config: " + configFile.getAbsolutePath());
            return true;
        } catch (Throwable e) {
            System.err.println("[Nuvoxel Config] Error loading config: " + e.getMessage());
            return false;
        }
    }

    public static List<String> listConfigs() {
        List<String> list = new ArrayList<>();
        try {
            if (configDir == null) init();
            File[] files = configDir.listFiles((dir, name) -> name.endsWith(".json"));
            if (files != null) {
                for (File f : files) {
                    list.add(f.getName().replace(".json", ""));
                }
            }
        } catch (Throwable ignored) {}
        return list;
    }

    private static String sanitizeName(String name) {
        return name.replaceAll("[^a-zA-Z0-9_-]", "");
    }
}
