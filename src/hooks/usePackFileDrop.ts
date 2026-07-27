import { useEffect, useRef } from "react";
import { pathIsDirectory } from "../services/modInstall";

export type PackContentSection = "mods" | "resourcepacks" | "shaders";

function isTauri(): boolean {
  return typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;
}

export interface PackFileDropPayload {
  mods: string[];
  resourcepacks: string[];
  shaders: string[];
}

interface PackFileDropHandlers {
  onEnter?: () => void;
  onLeave?: () => void;
  onDrop: (payload: PackFileDropPayload) => void;
}

function isZipPath(path: string): boolean {
  return path.toLowerCase().endsWith(".zip");
}

function isJarPath(path: string): boolean {
  return path.toLowerCase().endsWith(".jar");
}

export function usePackFileDrop(
  enabled: boolean,
  section: PackContentSection,
  handlers: PackFileDropHandlers,
) {
  const handlersRef = useRef(handlers);
  handlersRef.current = handlers;
  const sectionRef = useRef(section);
  sectionRef.current = section;

  useEffect(() => {
    if (!enabled || !isTauri()) return;

    let unlisten: (() => void) | undefined;
    let cancelled = false;

    void (async () => {
      const { getCurrentWindow } = await import("@tauri-apps/api/window");
      if (cancelled) return;

      unlisten = await getCurrentWindow().onDragDropEvent((event) => {
        if (event.payload.type === "enter") {
          handlersRef.current.onEnter?.();
        } else if (event.payload.type === "leave") {
          handlersRef.current.onLeave?.();
        } else if (event.payload.type === "drop") {
          handlersRef.current.onLeave?.();
          const dropPaths = event.payload.paths;
          void (async () => {
            const mods: string[] = [];
            const resourcepacks: string[] = [];
            const shaders: string[] = [];
            const active = sectionRef.current;

            for (const path of dropPaths) {
              if (isJarPath(path)) {
                mods.push(path);
                continue;
              }
              if (isZipPath(path)) {
                if (active === "shaders") shaders.push(path);
                else resourcepacks.push(path);
                continue;
              }
              if (await pathIsDirectory(path)) {
                if (active === "shaders") continue;
                resourcepacks.push(path);
              }
            }

            if (mods.length || resourcepacks.length || shaders.length) {
              handlersRef.current.onDrop({ mods, resourcepacks, shaders });
            }
          })();
        }
      });
    })();

    return () => {
      cancelled = true;
      unlisten?.();
    };
  }, [enabled]);
}
