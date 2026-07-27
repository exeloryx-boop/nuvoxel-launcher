import { Routes, Route } from "react-router-dom";
import { AppLayout } from "./components/layout/AppLayout";
import { HomePage } from "./pages/HomePage";
import { ModsPage } from "./pages/ModsPage";
import { ModPackDetailPage } from "./pages/ModPackDetailPage";
import { AccountsPage } from "./pages/AccountsPage";
import { ServersPage } from "./pages/ServersPage";
import { SettingsPage } from "./pages/SettingsPage";
import { useThemeEffect } from "./hooks/useThemeEffect";
import { useSkinSync } from "./hooks/useSkinSync";
import { useDevToolsGuard } from "./hooks/useDevToolsGuard";
import { useRetroSounds } from "./hooks/useRetroSounds";

export default function App() {
  useThemeEffect();
  useSkinSync();
  useDevToolsGuard();
  useRetroSounds();

  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route index element={<HomePage />} />
        <Route path="mods" element={<ModsPage />} />
        <Route path="mods/:packId" element={<ModPackDetailPage />} />
        <Route path="servers" element={<ServersPage />} />
        <Route path="accounts" element={<AccountsPage />} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>
    </Routes>
  );
}
