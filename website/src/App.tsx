import { Navigate, Route, Routes } from "react-router-dom";
import { SiteLayout } from "./components/SiteLayout";
import { HomePage } from "./pages/HomePage";
import { ModsPage } from "./pages/ModsPage";
import { ServersPage } from "./pages/ServersPage";
import { CommunityPage } from "./pages/CommunityPage";
import { LoginPage } from "./pages/LoginPage";
import { SkinsPage } from "./pages/SkinsPage";
import { DownloadPage } from "./pages/DownloadPage";
import { FeaturesPage } from "./pages/FeaturesPage";
import { VersionsPage } from "./pages/VersionsPage";
import { HelpPage } from "./pages/HelpPage";
import { BusinessPage } from "./pages/BusinessPage";
import { DocsPage } from "./pages/DocsPage";
import { FeedbackPage } from "./pages/FeedbackPage";
import { PrivacyPage } from "./pages/PrivacyPage";
import { TermsPage } from "./pages/TermsPage";
import { AdminPage } from "./pages/AdminPage";
import { ProtectedRoute } from "./components/ProtectedRoute";

export default function App() {
  return (
    <Routes>
      <Route element={<SiteLayout />}>
        <Route index element={<HomePage />} />
        <Route path="mods" element={<ModsPage />} />
        <Route path="servers" element={<ServersPage />} />
        <Route path="community" element={<CommunityPage />} />
        <Route path="login" element={<LoginPage />} />
        <Route path="download" element={<DownloadPage />} />
        <Route path="features" element={<FeaturesPage />} />
        <Route path="versions" element={<VersionsPage />} />
        <Route path="help" element={<HelpPage />} />
        <Route path="business" element={<BusinessPage />} />
        <Route path="docs" element={<DocsPage />} />
        <Route path="feedback" element={<FeedbackPage />} />
        <Route path="privacy" element={<PrivacyPage />} />
        <Route path="terms" element={<TermsPage />} />
        <Route path="admin" element={<AdminPage />} />
        <Route
          path="skins"
          element={
            <ProtectedRoute>
              <SkinsPage />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
