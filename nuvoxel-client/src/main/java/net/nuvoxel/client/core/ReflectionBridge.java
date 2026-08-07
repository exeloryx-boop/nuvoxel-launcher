package net.nuvoxel.client.core;

import net.fabricmc.loader.api.MappingResolver;

import java.lang.reflect.Field;
import java.lang.reflect.Method;
import java.lang.reflect.Modifier;

/**
 * Central reflection bridge for safely accessing Minecraft internals
 * through intermediary mappings. No direct Minecraft imports.
 */
public final class ReflectionBridge {
    private static MappingResolver mappings;

    // Cached classes
    private static Class<?> minecraftClientClass;

    public static void init(MappingResolver resolver) {
        mappings = resolver;
        try {
            minecraftClientClass = gameClass("net.minecraft.class_310");
        } catch (ClassNotFoundException e) {
            System.out.println("[Nuvoxel] Failed to cache core classes: " + e.getMessage());
        }
    }

    public static Class<?> gameClass(String intermediaryName) throws ClassNotFoundException {
        return Class.forName(mappings.mapClassName("intermediary", intermediaryName));
    }

    /** Find MinecraftClient.getInstance() */
    public static Object findClientInstance(Class<?> clientClass) throws ReflectiveOperationException {
        for (Method method : clientClass.getDeclaredMethods()) {
            if (Modifier.isStatic(method.getModifiers())
                    && method.getParameterCount() == 0
                    && method.getReturnType() == clientClass) {
                method.setAccessible(true);
                return method.invoke(null);
            }
        }
        throw new NoSuchMethodException("MinecraftClient.getInstance");
    }

    /** Create a Text object from a string. */
    public static Object createText(Class<?> textClass, String value) throws ReflectiveOperationException {
        for (Method method : textClass.getDeclaredMethods()) {
            if (Modifier.isStatic(method.getModifiers())
                    && method.getParameterCount() == 1
                    && method.getParameterTypes()[0] == String.class
                    && textClass.isAssignableFrom(method.getReturnType())) {
                method.setAccessible(true);
                return method.invoke(null, value);
            }
        }
        throw new NoSuchMethodException("Text.of");
    }

    /** Find ChatHud.addMessage(Text) */
    public static Method findAddMessageMethod(Class<?> chatHudClass, Class<?> textClass)
            throws NoSuchMethodException {
        for (Method method : chatHudClass.getDeclaredMethods()) {
            if (method.getParameterCount() == 1
                    && method.getReturnType() == Void.TYPE
                    && method.getParameterTypes()[0].isAssignableFrom(textClass)) {
                method.setAccessible(true);
                return method;
            }
        }
        throw new NoSuchMethodException("ChatHud.addMessage");
    }

    /** Find a field of a given type in the owner object. */
    public static Object findField(Object owner, Class<?> fieldType) {
        try {
            for (Field field : owner.getClass().getDeclaredFields()) {
                if (fieldType.isAssignableFrom(field.getType())) {
                    field.setAccessible(true);
                    Object value = field.get(owner);
                    if (value != null) return value;
                }
            }
        } catch (Throwable ignored) {}
        return null;
    }

    /** Find all fields of a given type. */
    public static Object[] findAllFields(Object owner, Class<?> fieldType) {
        java.util.List<Object> results = new java.util.ArrayList<>();
        try {
            for (Field field : owner.getClass().getDeclaredFields()) {
                if (fieldType.isAssignableFrom(field.getType())) {
                    field.setAccessible(true);
                    Object value = field.get(owner);
                    if (value != null) results.add(value);
                }
            }
        } catch (Throwable ignored) {}
        return results.toArray();
    }

    /** Get the current Window width via reflection. */
    public static int getWindowWidth(Object client) {
        try {
            Class<?> windowClass = gameClass("net.minecraft.class_1041");
            Object window = findField(client, windowClass);
            if (window == null) return 854;
            // getScaledWidth - look for int method with no params
            for (Method m : windowClass.getDeclaredMethods()) {
                if (m.getParameterCount() == 0 && m.getReturnType() == int.class) {
                    m.setAccessible(true);
                    int val = (int) m.invoke(window);
                    if (val > 100 && val < 10000) return val;
                }
            }
        } catch (Throwable ignored) {}
        return 854;
    }

    /** Get the current Window height via reflection. */
    public static int getWindowHeight(Object client) {
        try {
            Class<?> windowClass = gameClass("net.minecraft.class_1041");
            Object window = findField(client, windowClass);
            if (window == null) return 480;
            int foundCount = 0;
            for (Method m : windowClass.getDeclaredMethods()) {
                if (m.getParameterCount() == 0 && m.getReturnType() == int.class) {
                    m.setAccessible(true);
                    int val = (int) m.invoke(window);
                    foundCount++;
                    if (foundCount == 2 && val > 50 && val < 10000) return val;
                }
            }
        } catch (Throwable ignored) {}
        return 480;
    }

    /** Check if a key is currently pressed using GLFW bindings. */
    public static boolean isKeyDown(int keyCode) {
        try {
            // org.lwjgl.glfw.GLFW.glfwGetKey
            Class<?> glfwClass = Class.forName("org.lwjgl.glfw.GLFW");
            Method glfwGetKey = glfwClass.getMethod("glfwGetKey", long.class, int.class);

            // Get the window handle from MinecraftClient
            Object client = findClientInstance(minecraftClientClass);
            Class<?> windowClass = gameClass("net.minecraft.class_1041");
            Object window = findField(client, windowClass);
            if (window == null) return false;

            // Get the window handle (long field)
            for (Field f : windowClass.getDeclaredFields()) {
                if (f.getType() == long.class) {
                    f.setAccessible(true);
                    long handle = (long) f.get(window);
                    if (handle != 0) {
                        int state = (int) glfwGetKey.invoke(null, handle, keyCode);
                        return state == 1; // GLFW_PRESS
                    }
                }
            }
        } catch (Throwable ignored) {}
        return false;
    }

    /** Get player position as double[3] {x, y, z}. */
    public static double[] getPlayerPosition(Object client) {
        try {
            Class<?> playerClass = gameClass("net.minecraft.class_746");
            Object player = findField(client, playerClass);
            if (player == null) return null;

            // Entity position: look for getX, getY, getZ (double return, 0 params)
            double[] pos = new double[3];
            int found = 0;
            for (Method m : player.getClass().getSuperclass().getSuperclass().getDeclaredMethods()) {
                if (m.getParameterCount() == 0 && m.getReturnType() == double.class
                        && !Modifier.isStatic(m.getModifiers())) {
                    m.setAccessible(true);
                    double val = (double) m.invoke(player);
                    if (found < 3) {
                        pos[found] = val;
                        found++;
                    }
                    if (found >= 3) return pos;
                }
            }
            // Try getting from fields directly
            found = 0;
            for (Field f : player.getClass().getSuperclass().getSuperclass().getDeclaredFields()) {
                if (f.getType() == double.class && !Modifier.isStatic(f.getModifiers())) {
                    f.setAccessible(true);
                    double val = f.getDouble(player);
                    if (found < 3) {
                        pos[found] = val;
                        found++;
                    }
                    if (found >= 3) return pos;
                }
            }
        } catch (Throwable ignored) {}
        return null;
    }

    /** Get the current FPS. */
    public static int getFps(Object client) {
        try {
            // FPS is typically stored as a static int field or accessible via getCurrentFps
            for (Method m : minecraftClientClass.getDeclaredMethods()) {
                if (Modifier.isStatic(m.getModifiers())
                        && m.getParameterCount() == 0
                        && m.getReturnType() == int.class) {
                    m.setAccessible(true);
                    int val = (int) m.invoke(null);
                    if (val >= 0 && val < 10000) return val;
                }
            }
            // Fallback: static int field
            for (Field f : minecraftClientClass.getDeclaredFields()) {
                if (Modifier.isStatic(f.getModifiers()) && f.getType() == int.class) {
                    f.setAccessible(true);
                    int val = f.getInt(null);
                    if (val >= 0 && val < 10000) return val;
                }
            }
        } catch (Throwable ignored) {}
        return -1;
    }

    /** Check if the current screen is null (i.e., player is in-game, no GUI open). */
    public static boolean isInGame(Object client) {
        try {
            Class<?> screenClass = gameClass("net.minecraft.class_437");
            Object screen = findField(client, screenClass);
            return screen == null;
        } catch (Throwable e) {
            return true;
        }
    }

    /** Get player health. */
    public static float getPlayerHealth(Object client) {
        try {
            Class<?> playerClass = gameClass("net.minecraft.class_746");
            Object player = findField(client, playerClass);
            if (player == null) return 20f;

            // getHealth: float return, 0 params
            for (Method m : player.getClass().getSuperclass().getDeclaredMethods()) {
                if (m.getParameterCount() == 0 && m.getReturnType() == float.class
                        && !Modifier.isStatic(m.getModifiers())) {
                    m.setAccessible(true);
                    float val = (float) m.invoke(player);
                    if (val >= 0 && val <= 40) return val;
                }
            }
        } catch (Throwable ignored) {}
        return 20f;
    }

    /** Get the player's biome name as a string. */
    public static String getBiome(Object client) {
        // This is complex via reflection, return placeholder
        return "Unknown";
    }

    /** Get the time of day. */
    public static long getTimeOfDay(Object client) {
        try {
            Class<?> worldClass = gameClass("net.minecraft.class_638");
            Object world = findField(client, worldClass);
            if (world == null) return 0;

            for (Method m : worldClass.getDeclaredMethods()) {
                if (m.getParameterCount() == 0 && m.getReturnType() == long.class
                        && !Modifier.isStatic(m.getModifiers())) {
                    m.setAccessible(true);
                    long val = (long) m.invoke(world);
                    if (val >= 0) return val % 24000;
                }
            }
        } catch (Throwable ignored) {}
        return 0;
    }
}
