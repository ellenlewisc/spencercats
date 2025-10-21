"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../components/supabaseclient";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const router = useRouter();

  // Redirect immediately if user is already logged in
  useEffect(() => {
    const checkUser = async () => {
      const { data } = await supabase.auth.getUser();
      if (data.user) router.push("/"); // already logged in
    };
    checkUser();

    const { data: { subscription } = {} } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) router.push("/"); // redirect after login elsewhere
    });

    return () => subscription?.unsubscribe();
  }, [router]);

  const handleLogin = async () => {
    setLoading(true);
    setError("");

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setError(error.message);
    } else if (data.session?.user) {
      router.push("/"); // redirect after successful login
    } else {
      setError("Login failed: no session returned");
    }

    setLoading(false);
  };

  const containerStyle = {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    height: "100vh",
    fontFamily: "Arial, sans-serif",
    color: "#fff",
  };

  const cardStyle = {
    background: "#121212",
    padding: "40px",
    borderRadius: "12px",
    boxShadow: "0 4px 20px rgba(255, 152, 0, 0.3)",
    width: "100%",
    maxWidth: "400px",
    textAlign: "center",
    border: "1px solid #ff9800",
  };

  const inputStyle = {
    width: "100%",
    padding: "12px",
    margin: "10px 0",
    borderRadius: "6px",
    border: "1px solid #ff9800",
    background: "#1c1c1c",
    color: "#fff",
    fontSize: "16px",
    boxSizing: "border-box",
  };

  const buttonStyle = {
    width: "100%",
    padding: "12px",
    marginTop: "10px",
    borderRadius: "6px",
    border: "none",
    background: "#ff9800",
    color: "#000",
    fontWeight: "bold",
    fontSize: "16px",
    cursor: "pointer",
    transition: "all 0.2s ease",
  };

  const buttonHoverStyle = { background: "#e68900" };
  const errorStyle = { color: "#ff5252", marginTop: "10px" };

  return (
    <>
      <style jsx global>{`
        html, body {
          margin: 0;
          padding: 0;
          background-color: #000;
          height: 100%;
        }
      `}</style>

      <div style={containerStyle}>
        <div style={cardStyle}>
          <h2 style={{ marginBottom: "20px" }}>Login</h2>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={inputStyle}
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={inputStyle}
          />
          <button
            onClick={handleLogin}
            disabled={loading}
            style={buttonStyle}
            onMouseEnter={(e) => (e.currentTarget.style.background = buttonHoverStyle.background)}
            onMouseLeave={(e) => (e.currentTarget.style.background = buttonStyle.background)}
          >
            {loading ? "Logging in..." : "Login"}
          </button>
          {error && <p style={errorStyle}>{error}</p>}
        </div>
      </div>
    </>
  );
}
