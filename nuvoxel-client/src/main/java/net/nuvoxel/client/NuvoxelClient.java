package net.nuvoxel.client;

import net.fabricmc.api.ClientModInitializer;

/**
 * Entry point for the Nuvoxel Client Fabric module.  Feature modules are kept
 * separate from launcher code so the same account can safely use several
 * Minecraft versions without modifying the vanilla game files.
 */
public final class NuvoxelClient implements ClientModInitializer {
    public static final String MOD_ID = "nuvoxelclient";
    @Override
    public void onInitializeClient() {
        // Keep this entry point dependency-free: the same lightweight module
        // can then be loaded by all supported Fabric Minecraft versions.
        System.out.println("[Nuvoxel Client] initialized");
    }
}
