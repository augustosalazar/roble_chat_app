import { Routes, Route } from "react-router-dom";
import ProtectedRoute from './components/ProtectedRoute';
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import ChatPage from "./pages/ChatPage";
import SsoDone from "./pages/SsoDone";

function App() {
  return (
    <Routes>
      <Route path="/" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/sso-done" element={<SsoDone />} />
      <Route
        path="/chat"
        element={
          <ProtectedRoute requiredRole={["admin", "user"]}>
            <ChatPage />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}

export default App;
