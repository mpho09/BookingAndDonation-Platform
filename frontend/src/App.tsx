import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { Layout } from "./components/Layout";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { Landing } from "./pages/Landing";
import { Facilities } from "./pages/Facilities";
import { ResourceDetail } from "./pages/ResourceDetail";
import { Donate } from "./pages/Donate";
import { Login } from "./pages/Login";
import { Signup } from "./pages/Signup";
import { MemberDashboard } from "./pages/MemberDashboard";
import { AdminDashboard } from "./pages/AdminDashboard";

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<Landing />} />
            <Route path="facilities" element={<Facilities />} />
            <Route path="facilities/:id" element={<ResourceDetail />} />
            <Route path="donate" element={<Donate />} />
            <Route path="login" element={<Login />} />
            <Route path="signup" element={<Signup />} />
            <Route
              path="dashboard"
              element={
                <ProtectedRoute>
                  <MemberDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="admin"
              element={
                <ProtectedRoute roles={["staff", "admin"]}>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
