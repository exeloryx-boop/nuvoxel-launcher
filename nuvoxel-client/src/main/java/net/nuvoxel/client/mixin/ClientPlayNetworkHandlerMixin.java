package net.nuvoxel.client.mixin;

import net.minecraft.client.network.ClientPlayNetworkHandler;
import net.nuvoxel.client.core.CommandHandler;
import org.spongepowered.asm.mixin.Mixin;
import org.spongepowered.asm.mixin.injection.At;
import org.spongepowered.asm.mixin.injection.Inject;
import org.spongepowered.asm.mixin.injection.callback.CallbackInfo;

/**
 * Intercepts chat messages sent by the client to process Nuvoxel Client commands (.config, .toggle, .help).
 */
@Mixin(ClientPlayNetworkHandler.class)
public abstract class ClientPlayNetworkHandlerMixin {

    @Inject(method = "sendChatMessage", at = @At("HEAD"), cancellable = true)
    private void nuvoxel$onSendChatMessage(String content, CallbackInfo ci) {
        if (content != null && content.startsWith(".")) {
            boolean handled = CommandHandler.execute(content);
            if (handled) {
                ci.cancel();
            }
        }
    }
}
