package net.nuvoxel.client;

import net.fabricmc.api.ClientModInitializer;
import net.fabricmc.fabric.api.client.event.lifecycle.v1.ClientTickEvents;
import net.fabricmc.fabric.api.client.keybinding.v1.KeyBindingHelper;
import net.minecraft.client.MinecraftClient;
import net.minecraft.client.option.KeyBinding;
import net.minecraft.client.util.InputUtil;
import net.minecraft.text.Text;
import net.nuvoxel.client.core.ModuleManager;
import net.nuvoxel.client.gui.ScreenClickGui;

import org.lwjgl.glfw.GLFW;

/**
 * Nuvoxel Client — Premium Visual Mod for Minecraft.
 * Uses proper Fabric API events for keybinds, ticking and rendering.
 */
public final class NuvoxelClient implements ClientModInitializer {
    public static final String MOD_ID = "nuvoxelclient";
    public static final String MOD_NAME = "Nuvoxel Client";
    public static final String VERSION = "0.2.0-beta";

    private static NuvoxelClient INSTANCE;
    private static ModuleManager moduleManager;
    private static boolean initialized = false;
    private static boolean welcomeShown = false;

    private static KeyBinding clickGuiKeybind;

    @Override
    public void onInitializeClient() {
        INSTANCE = this;

        moduleManager = new ModuleManager();
        net.nuvoxel.client.core.ConfigManager.init();

        // Register ClickGUI keybind via Fabric API
        clickGuiKeybind = KeyBindingHelper.registerKeyBinding(new KeyBinding(
                "key.nuvoxelclient.clickgui",
                InputUtil.Type.KEYSYM,
                GLFW.GLFW_KEY_RIGHT_SHIFT,
                "category.nuvoxelclient"
        ));

        // Register client tick event for module ticking & keybind processing
        ClientTickEvents.END_CLIENT_TICK.register(client -> {
            if (client.player == null) return;

            // Mark as initialized once player is in-world
            if (!initialized) {
                initialized = true;
                System.out.println("[Nuvoxel Client] Client ready — player joined world");
            }

            // Show welcome message once
            if (!welcomeShown) {
                welcomeShown = true;
                showChatMessage(client, "§b§l[Nuvoxel] §r§7Visual Client §av" + VERSION + " §7loaded!");
                showChatMessage(client, "§b§l[Nuvoxel] §r§7Press §e§lRSHIFT §7for ClickGUI | Use §e§l.config §7to save setups!");
            }

            // ClickGUI toggle
            while (clickGuiKeybind.wasPressed()) {
                if (client.currentScreen instanceof ScreenClickGui) {
                    client.setScreen(null);
                } else {
                    client.setScreen(new ScreenClickGui(moduleManager));
                }
            }

            // Tick all modules
            moduleManager.onTick(client);
        });

        System.out.println("[Nuvoxel Client] Visual mod initialized — v" + VERSION);
    }

    public static NuvoxelClient getInstance() { return INSTANCE; }
    public static ModuleManager getModuleManager() { return moduleManager; }
    public static boolean isReady() { return initialized; }

    public static void showChatMessage(Object clientObj, String message) {
        try {
            MinecraftClient client;
            if (clientObj instanceof MinecraftClient mc) {
                client = mc;
            } else {
                client = MinecraftClient.getInstance();
            }
            if (client != null && client.player != null) {
                client.player.sendMessage(Text.of(message), false);
            }
        } catch (Throwable e) {
            System.out.println("[Nuvoxel Client] Chat: " + message);
        }
    }
}
