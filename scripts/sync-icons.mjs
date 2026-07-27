import { copyFileSync, existsSync } from "node:fs";
import { execSync } from "node:child_process";

const iconSource = "src-tauri/icons/icon.png";

if (!existsSync(iconSource)) {
  console.log("Generating Tauri icons from public/logo.svg...");
  execSync("npx tauri icon public/logo.svg", { stdio: "inherit" });
}

for (const dest of ["public/app-icon.png", "public/app-icon-square.png"]) {
  copyFileSync(iconSource, dest);
  console.log(`Synced ${dest}`);
}
