import { BrowserRouter, Routes, Route } from "react-router-dom";
import { SessionProvider } from "./context/SessionContext";
import HomePage from "./pages/HomePage";
import PlayerPage from "./pages/PlayerPage";

// App shell: routing + the shared session/recommendation provider. Page
// content lives in ./pages, reusable bits in ./components — kept tiny on purpose.
export default function App() {
  return (
    <BrowserRouter>
      <SessionProvider>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/player" element={<PlayerPage />} />
        </Routes>
      </SessionProvider>
    </BrowserRouter>
  );
}
