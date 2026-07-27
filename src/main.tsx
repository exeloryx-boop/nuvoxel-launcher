import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { migrateLegacyStorage } from "./utils/storageMigration";
import { readStoredLanguage, setI18nLocale, type Locale } from "./i18n";
import { registerCurseForgeApiKeyGetter } from "./services/curseforge";
import { useAppStore } from "./store/useAppStore";
import App from "./App";
import "./index.css";

migrateLegacyStorage();
setI18nLocale(readStoredLanguage() as Locale);

registerCurseForgeApiKeyGetter(() => useAppStore.getState().curseforgeApiKey);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
);
