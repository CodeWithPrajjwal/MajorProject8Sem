import "./App.css";
import { Route, BrowserRouter as Router, Routes } from "react-router-dom";
import LandingPage from "./pages/landing";
import Authentication from "./pages/authentication";
import { AuthProvider } from "./contexts/AuthContext";
import VideoMeetComponent from "./pages/VideoMeet";
import HomeComponent from "./pages/home";
import History from "./pages/history";
import { VideoProvider } from "./contexts/VideoContext";

function App() {
  return (
    <div className="App">
      <Router
        future={{
          v7_fetcherPersist: true,
          v7_normalizeFormMethod: true,
          v7_partialHydration: true,
          v7_relativeSplatPath: true,
          v7_skipActionErrorRevalidation: true,
          v7_startTransition: true,
        }}
      >
        <AuthProvider>
          <VideoProvider>
            <Routes>
              <Route path="/" element={<LandingPage />} />

              <Route path="/auth" element={<Authentication />} />

              <Route path="/home" s element={<HomeComponent />} />
              <Route path="/history" element={<History />} />
              <Route path="/:url" element={<VideoMeetComponent />} />
            </Routes>
          </VideoProvider>
        </AuthProvider>
      </Router>
    </div>
  );
}

export default App;
