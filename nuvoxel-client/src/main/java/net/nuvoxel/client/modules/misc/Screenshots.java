package net.nuvoxel.client.modules.misc;

import net.nuvoxel.client.core.Category;
import net.nuvoxel.client.core.Module;

/**
 * Screenshots — Enhanced screenshot module with notification sound
 * and auto-copy to clipboard functionality.
 */
public class Screenshots extends Module {

    public Screenshots() {
        super("Screenshots", "Enhanced screenshot with auto-copy and notifications", Category.MISC);
    }

    @Override
    protected void onEnable() {
        System.out.println("[Nuvoxel] Enhanced Screenshots enabled");
    }

    @Override
    protected void onDisable() {
        System.out.println("[Nuvoxel] Enhanced Screenshots disabled");
    }
}
