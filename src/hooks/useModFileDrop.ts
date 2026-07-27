import { useEffect, useRef } from "react";

function isTauri(): boolean {
  return typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;
}

interface ModFileDropHandlers {
  onEnter?: () => void;
  onLeave?: () => void;
  onDrop: (paths: string[]) => void;
}

export function useModFileDrop(enabled: boolean, handlers: ModFileDropHandlers) {
  const handlersRef = useRef(handlers);
  handlersRef.current = handlers;

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
          const jars = event.payload.paths.filter((p) =>
            p.toLowerCase().endsWith(".jar"),
          );
          if (jars.length > 0) handlersRef.current.onDrop(jars);
        }
      });
    })();

    return () => {
      cancelled = true;
      unlisten?.();
    };
  }, [enabled]);
}
