package net.nuvoxel.client.modules.visuals;

import net.minecraft.client.MinecraftClient;
import net.minecraft.entity.ItemEntity;
import net.nuvoxel.client.core.Category;
import net.nuvoxel.client.core.Module;

/**
 * ItemPhysics — Realistic spinning rotation for dropped items near player.
 */
public class ItemPhysics extends Module {

    public ItemPhysics() {
        super("ItemPhysics", "Realistic dropped item physics and rotation", Category.VISUALS, true, 0);
    }

    @Override
    public void onTick(MinecraftClient client) {
        if (client.world == null) return;

        try {
            for (var entity : client.world.getEntities()) {
                if (entity instanceof ItemEntity itemEntity) {
                    itemEntity.setYaw(itemEntity.getYaw() + 15.0f);
                }
            }
        } catch (Throwable ignored) {}
    }
}
