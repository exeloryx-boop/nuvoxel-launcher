import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { readStoredLanguage, setI18nLocale, type Locale } from "../../src/i18n";
import App from "./App";
import "./index.css";

setI18nLocale(readStoredLanguage() as Locale);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
);
