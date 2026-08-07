package net.nuvoxel.client.core;

import net.minecraft.client.MinecraftClient;
import net.nuvoxel.client.modules.hud.*;
import net.nuvoxel.client.modules.render.*;
import net.nuvoxel.client.modules.visuals.*;
import net.nuvoxel.client.modules.world.*;
import net.nuvoxel.client.modules.misc.*;

import java.util.*;
import java.util.stream.Collectors;

import org.lwjgl.glfw.GLFW;

/**
 * Central registry for all visual modules. Handles registration,
 * lookup, tick forwarding, and keybind management.
 */
public final class ModuleManager {

    private final List<Module> modules = new ArrayList<>();
    private final Map<Category, List<Module>> categoryMap = new LinkedHashMap<>();
    private final Map<Integer, Module> keybindMap = new HashMap<>();
    private final Set<Integer> pressedKeys = new HashSet<>();

    public ModuleManager() {
        // Initialize category map
        for (Category cat : Category.values()) {
            categoryMap.put(cat, new ArrayList<>());
        }

        // ── VISUALS ──
        register(new Fullbright());
        register(new BlockOverlay());
        register(new ItemPhysics());
        register(new Particles());
        register(new Animations());
        register(new Crosshair());

        // ── HUD ──
        register(new FpsDisplay());
        register(new CoordinatesDisplay());
        register(new ArmorStatus());
        register(new PotionDisplay());
        register(new Clock());
        register(new Watermark());
        register(new Keystrokes());
        register(new TargetHUD());
        register(new DirectionHUD());

        // ── RENDER ──
        register(new MotionBlur());
        register(new Chams());
        register(new TimeChanger());
        register(new Nametags());

        // ── WORLD ──
        register(new Ambience());
        register(new Weather());
        register(new FogControl());

        // ── MISC ──
        register(new SprintToggle());
        register(new ZoomModule());
        register(new Screenshots());

        System.out.println("[Nuvoxel Client] Registered " + modules.size() + " visual modules");
    }

    private void register(Module module) {
        modules.add(module);
        categoryMap.get(module.getCategory()).add(module);
        if (module.getKeybind() != 0) {
            keybindMap.put(module.getKeybind(), module);
        }
    }

    public List<Module> getModules() { return Collections.unmodifiableList(modules); }

    public List<Module> getModules(Category category) {
        return Collections.unmodifiableList(categoryMap.getOrDefault(category, Collections.emptyList()));
    }

    public List<Module> getEnabledModules() {
        return modules.stream().filter(Module::isEnabled).collect(Collectors.toList());
    }

    public Module getModule(String name) {
        return modules.stream()
                .filter(m -> m.getName().equalsIgnoreCase(name))
                .findFirst().orElse(null);
    }

    /** Called every client tick — processes keybinds and ticks enabled modules. */
    public void onTick(MinecraftClient client) {
        // Process keybinds via GLFW directly
        long windowHandle = client.getWindow().getHandle();
        if (windowHandle != 0) {
            for (Map.Entry<Integer, Module> entry : keybindMap.entrySet()) {
                int key = entry.getKey();
                boolean down = GLFW.glfwGetKey(windowHandle, key) == GLFW.GLFW_PRESS;
                if (down && !pressedKeys.contains(key)) {
                    pressedKeys.add(key);
                    // Don't toggle via keybind if a screen is open
                    if (client.currentScreen == null) {
                        entry.getValue().toggle();
                    }
                } else if (!down) {
                    pressedKeys.remove(key);
                }
            }
        }

        // Tick enabled modules
        for (Module module : modules) {
            if (module.isEnabled()) {
                try {
                    module.onTick(client);
                } catch (Throwable e) {
                    // Silently skip broken module ticks
                }
            }
        }
    }
}
