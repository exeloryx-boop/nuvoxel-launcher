package net.nuvoxel.client.modules.visuals;

import net.minecraft.client.MinecraftClient;
import net.minecraft.util.hit.BlockHitResult;
import net.minecraft.util.hit.HitResult;
import net.nuvoxel.client.core.Category;
import net.nuvoxel.client.core.Module;

/**
 * BlockOverlay — Displays targeted block name, coordinates, and info.
 */
public class BlockOverlay extends Module {

    private String targetBlockInfo = "";

    public BlockOverlay() {
        super("BlockOverlay", "Enhanced targeted block info and selection overlay", Category.VISUALS, true, 0);
    }

    @Override
    public void onTick(MinecraftClient client) {
        if (client.crosshairTarget != null && client.crosshairTarget.getType() == HitResult.Type.BLOCK && client.world != null) {
            BlockHitResult blockHit = (BlockHitResult) client.crosshairTarget;
            var state = client.world.getBlockState(blockHit.getBlockPos());
            String blockName = state.getBlock().getName().getString();
            var pos = blockHit.getBlockPos();
            targetBlockInfo = String.format("Target: %s [%d, %d, %d]", blockName, pos.getX(), pos.getY(), pos.getZ());
        } else {
            targetBlockInfo = "";
        }
    }

    public String getTargetBlockInfo() {
        return targetBlockInfo;
    }
}
