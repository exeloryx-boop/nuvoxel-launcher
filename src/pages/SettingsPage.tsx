import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { SettingsLayout } from "../components/settings/SettingsLayout";
import { SettingsGeneral } from "../components/settings/SettingsGeneral";
import { SettingsAppearance } from "../components/settings/SettingsAppearance";
import { SettingsLaunch } from "../components/settings/SettingsLaunch";
import { SettingsConnections } from "../components/settings/SettingsConnections";
import { SettingsAbout } from "../components/settings/SettingsAbout";
import { useAppStore } from "../store/useAppStore";

export function SettingsPage() {
  const section = useAppStore((s) => s.settingsSection);
  const navigate = useNavigate();

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") navigate("/");
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [navigate]);

  const content = {
    general: <SettingsGeneral />,
    appearance: <SettingsAppearance />,
    launch: <SettingsLaunch />,
    connections: <SettingsConnections />,
    about: <SettingsAbout />,
  }[section];

  return <SettingsLayout>{content}</SettingsLayout>;
}
