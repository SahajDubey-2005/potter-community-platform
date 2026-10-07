import React, { useState, useEffect } from "react";
import API from "./api";
import { UserCheck, LogIn, UserPlus, ShieldAlert, LayoutDashboard, LogOut } from "lucide-react";

export default function App() {
  const [token, setToken] = useState(localStorage.getItem("token") || "");
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState("login");
  const [formData, setFormData] = useState({ full_name: "", email: "", password: "", role: "CITIZEN" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (token) {
      fetchProfile();
    }
  }, [token]);

  const fetchProfile = async () => {
    try {
      const res = await API.get("/auth/me");
      setUser(res.data);
    } catch (err) {
      handleLogout();
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    setToken("");
    setUser(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (activeTab === "login") {
        const res = await API.post("/auth/login", { email: formData.email, password: formData.password });
        localStorage.setItem("token", res.data.access_token);
        setToken(res.data.access_token);
      } else {
        await API.post("/auth/register", formData);
        setActiveTab("login");
        setError("Registration successful! Please log in.");
      }
    } catch (err) {
      console.log("Full Error Object:", err.response);
      const details = err.response?.data?.detail;
      if (Array.isArray(details)) {
        setError(details.map(d => `${d.loc.join("->")}: ${d.msg}`).join(" | "));
      } else {
        setError(details || err.message || "An error occurred.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col">
      <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur px-6 py-4 flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <LayoutDashboard className="h-6 w-6 text-indigo-500" />
          <span className="font-bold text-xl tracking-tight text-white">Potter Platform</span>
        </div>
        {user && (
          <div className="flex items-center space-x-4">
            <span className="text-sm text-slate-400">Logged in as <strong className="text-indigo-400">{user.full_name}</strong> ({user.role})</span>
            <button onClick={handleLogout} className="flex items-center space-x-1 text-sm bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-1.5 rounded-lg border border-slate-700 transition cursor-pointer">
              <LogOut className="h-4 w-4" />
              <span>Logout</span>
            </button>
          </div>
        )}
      </header>

      <main className="flex-1 flex items-center justify-center p-6">
        {token && user ? (
          <div className="bg-slate-800 border border-slate-700 rounded-2xl p-8 max-w-lg w-full shadow-2xl">
            <div className="flex items-center space-x-3 mb-6">
              <UserCheck className="h-8 w-8 text-emerald-400" />
              <div>
                <h2 className="text-2xl font-bold text-white">Welcome, {user.full_name}!</h2>
                <p className="text-slate-400 text-sm">Authenticated Access Role: {user.role}</p>
              </div>
            </div>
            <div className="space-y-4 border-t border-slate-700 pt-4 text-sm text-slate-300">
              <div className="flex justify-between py-1"><span className="text-slate-500">Email:</span> <span>{user.email}</span></div>
              <div className="flex justify-between py-1"><span className="text-slate-500">User ID:</span> <span>#{user.id}</span></div>
              <div className="flex justify-between py-1"><span className="text-slate-500">Account Status:</span> <span className="text-emerald-400 font-semibold">Active</span></div>
            </div>
          </div>
        ) : (
          <div className="bg-slate-800 border border-slate-700 rounded-2xl p-8 max-w-md w-full shadow-2xl">
            <div className="flex border-b border-slate-700 mb-6">
              <button
                className={`flex-1 py-3 font-semibold text-center flex items-center justify-center space-x-2 border-b-2 transition cursor-pointer ${activeTab === "login" ? "border-indigo-500 text-indigo-400" : "border-transparent text-slate-400 hover:text-slate-200"}`}
                onClick={() => { setActiveTab("login"); setError(""); }}
              >
                <LogIn className="h-4 w-4" />
                <span>Login</span>
              </button>
              <button
                className={`flex-1 py-3 font-semibold text-center flex items-center justify-center space-x-2 border-b-2 transition cursor-pointer ${activeTab === "register" ? "border-indigo-500 text-indigo-400" : "border-transparent text-slate-400 hover:text-slate-200"}`}
                onClick={() => { setActiveTab("register"); setError(""); }}
              >
                <UserPlus className="h-4 w-4" />
                <span>Register</span>
              </button>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-950/50 border border-red-800 rounded-lg text-red-300 text-sm flex items-center space-x-2">
                <ShieldAlert className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {activeTab === "register" && (
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    value={formData.full_name}
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Full Name"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="name@domain.com"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Password</label>
                <input
                  type="password"
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="••••••••"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-2.5 rounded-lg transition duration-200 mt-2 disabled:opacity-50 cursor-pointer"
              >
                {loading ? "Processing..." : activeTab === "login" ? "Sign In" : "Create Account"}
              </button>
            </form>
          </div>
        )}
      </main>
    </div>
  );
}