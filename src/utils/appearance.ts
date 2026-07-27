const MAX_APPEARANCE_BYTES = 2 * 1024 * 1024;

export type AppearanceKind = "skin" | "cape";

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("appearanceReadError"));
    reader.onload = () => {
      if (typeof reader.result !== "string") {
        reject(new Error("appearanceReadError"));
        return;
      }
      resolve(reader.result);
    };
    reader.readAsDataURL(file);
  });
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("appearanceInvalidPng"));
    image.src = src;
  });
}

/**
 * Reads a local PNG and rejects files that Minecraft / CustomSkinLoader cannot
 * reasonably consume. Dimensions are intentionally flexible for capes because
 * several cape formats are in common use.
 */
export async function readAppearancePng(
  file: File,
  kind: AppearanceKind,
): Promise<string> {
  const looksLikePng =
    file.type === "image/png" || file.name.toLowerCase().endsWith(".png");
  if (!looksLikePng) throw new Error("appearancePngOnly");
  if (file.size === 0 || file.size > MAX_APPEARANCE_BYTES) {
    throw new Error("appearanceTooLarge");
  }

  const dataUrl = await readAsDataUrl(file);
  const image = await loadImage(dataUrl);
  if (image.width < 1 || image.height < 1 || image.width > 2048 || image.height > 2048) {
    throw new Error("appearanceInvalidPng");
  }

  if (
    kind === "skin" &&
    !(
      image.width === 64 &&
      (image.height === 32 || image.height === 64)
    )
  ) {
    throw new Error("appearanceSkinSize");
  }

  return dataUrl;
}
