import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { AuthProvider } from "./context/AuthContext";
import Navbar from "./components/Navbar";
import ProtectedRoute from "./components/ProtectedRoute";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Detect from "./pages/Detect";
import History from "./pages/History";
import LiveScanner from "./pages/LiveScanner";   // NEW

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Navbar />
        <Routes>
          <Route path="/"            element={<Home />} />
          <Route path="/login"       element={<Login />} />
          <Route path="/register"    element={<Register />} />
          <Route path="/dashboard"   element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/detect"      element={<ProtectedRoute><Detect /></ProtectedRoute>} />
          <Route path="/history"     element={<ProtectedRoute><History /></ProtectedRoute>} />
          <Route path="/live"        element={<ProtectedRoute><LiveScanner /></ProtectedRoute>} />  {/* NEW */}
          <Route path="*"            element={<Navigate to="/" />} />
        </Routes>
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: "#0d1220",
              color: "#f0f4ff",
              border: "1px solid rgba(255,255,255,0.1)",
              fontFamily: "DM Sans, sans-serif",
              fontSize: "0.9rem",
            },
          }}
        />
      </BrowserRouter>
    </AuthProvider>
  );
}