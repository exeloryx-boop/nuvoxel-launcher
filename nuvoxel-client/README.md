# Nuvoxel Client (Fabric, Minecraft 1.21.4)

This is the in-game Fabric module used by Nuvoxel Launcher client profiles.

## Build

Install JDK 21 and Gradle 8.12 or newer, then run:

```powershell
gradle build
```

The distributable JAR is created in `build/libs/`. Publish the remapped JAR to
the Nuvoxel update service before enabling automatic installation in the
launcher. Do not publish the `-dev` JAR.

The module does not use Minecraft internals, so one JAR supports Fabric
Minecraft versions from `1.21.4` through `26.2`. Put that published artifact at:

```text
api/client-mods/nuvoxel-client.jar
```

The launcher downloads it from `/client/mods/nuvoxel-client.jar` into the
selected Nuvoxel profile before every launch. When the module begins to use
Minecraft internals, return to one separately tested artifact per version.

## Planned beta modules

- configurable HUD: FPS, coordinates and ping;
- keybind settings: zoom and sprint toggle;
- in-game Nuvoxel menu and account status;
- profile settings that remain separate from vanilla Minecraft.
