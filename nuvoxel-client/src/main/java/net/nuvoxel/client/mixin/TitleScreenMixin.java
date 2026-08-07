package net.nuvoxel.client.mixin;

import net.minecraft.client.gui.screen.TitleScreen;
import net.nuvoxel.client.gui.NuvoxelMainMenuScreen;
import org.spongepowered.asm.mixin.Mixin;
import org.spongepowered.asm.mixin.injection.At;
import org.spongepowered.asm.mixin.injection.Inject;
import org.spongepowered.asm.mixin.injection.callback.CallbackInfo;

/**
 * Replaces the vanilla title screen with the Nuvoxel-branded main menu on first init.
 */
@Mixin(TitleScreen.class)
public class TitleScreenMixin {

    @Inject(method = "init", at = @At("HEAD"), cancellable = true)
    private void nuvoxel$replaceMainMenu(CallbackInfo ci) {
        var client = net.minecraft.client.MinecraftClient.getInstance();
        if (client != null && !(client.currentScreen instanceof NuvoxelMainMenuScreen)) {
            client.setScreen(new NuvoxelMainMenuScreen());
            ci.cancel();
        }
    }
}
