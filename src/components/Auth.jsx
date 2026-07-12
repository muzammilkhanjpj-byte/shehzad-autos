import React, { useState } from "react";
import { SignIn, UserPlus, Envelope, Lock, User, ArrowLeft, CircleNotch } from "@phosphor-icons/react";
import { supabase } from "../utils/supabaseClient";

export default function Auth({ onCancel, onMockLogin }) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const handleGoogleSignIn = async () => {
    setError("");
    setSuccessMsg("");
    setLoading(true);
    try {
      const { error: authError } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: window.location.origin,
        },
      });
      if (authError) throw authError;
    } catch (err) {
      console.error("Google authentication error:", err);
      setError(err.message || "Failed to sign in with Google.");
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccessMsg("");
    setLoading(true);

    // Basic Validation
    if (!email.trim() || !password.trim()) {
      setError("Please fill in all required fields.");
      setLoading(false);
      return;
    }

    if (!isLogin && !name.trim()) {
      setError("Please enter your name to sign up.");
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters long.");
      setLoading(false);
      return;
    }

    try {
      if (isLogin) {
        // Supabase Login
        const { data, error: authError } = await supabase.auth.signInWithPassword({
          email: email.trim().toLowerCase(),
          password,
        });

        if (authError) {
          throw authError;
        }
      } else {
        // Supabase SignUp
        const { data, error: authError } = await supabase.auth.signUp({
          email: email.trim().toLowerCase(),
          password,
          options: {
            data: {
              name: name.trim(),
            },
          },
        });

        if (authError) {
          throw authError;
        }

        // Handle email confirmation check
        if (data?.user && !data?.session) {
          setSuccessMsg("Registration successful! Please check your email inbox to verify your account before logging in.");
          // Clear inputs
          setName("");
          setEmail("");
          setPassword("");
          setIsLogin(true); // Switch to login screen
        } else {
          setSuccessMsg("Account created successfully!");
        }
      }
    } catch (err) {
      console.error("Supabase authentication error:", err);
      setError(err.message || "An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: "40px 0", minHeight: "70vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div className="form-card" style={{ maxWidth: "450px", width: "100%", margin: "0" }}>
        
        {/* Back Link */}
        <button
          type="button"
          onClick={onCancel}
          style={{
            background: "none",
            border: "none",
            color: "var(--color-text-secondary)",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            fontSize: "14px",
            cursor: "pointer",
            marginBottom: "24px",
            padding: 0,
            transition: "var(--transition-fast)"
          }}
        >
          <ArrowLeft size={16} />
          <span>Back to Browse</span>
        </button>

        {/* Title */}
        <div style={{ textAlign: "center", marginBottom: "32px" }}>
          <h2 style={{ fontSize: "28px", fontWeight: 800, marginBottom: "8px" }}>
            {isLogin ? "Welcome Back" : "Create Account"}
          </h2>
          <p style={{ color: "var(--color-text-secondary)", fontSize: "14px" }}>
            {isLogin 
              ? "Sign in to manage listings and sell vehicles." 
              : "Register to list your sports, luxury or electric cars."}
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div style={{
            background: "rgba(239, 68, 68, 0.1)",
            border: "1px solid rgba(239, 68, 68, 0.3)",
            borderRadius: "var(--radius-sm)",
            color: "#f87171",
            padding: "16px",
            fontSize: "13px",
            marginBottom: "20px",
            textAlign: "center",
            display: "flex",
            flexDirection: "column",
            gap: "10px",
            alignItems: "center"
          }}>
            <div>{error}</div>
          </div>
        )}

        {/* Success Message */}
        {successMsg && (
          <div style={{
            background: "rgba(16, 185, 129, 0.1)",
            border: "1px solid rgba(16, 185, 129, 0.3)",
            borderRadius: "var(--radius-sm)",
            color: "#34d399",
            padding: "12px",
            fontSize: "13px",
            marginBottom: "20px",
            textAlign: "center"
          }}>
            {successMsg}
          </div>
        )}

        {/* Auth Form */}
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          
          {/* Name Field (Sign Up Only) */}
          {!isLogin && (
            <div className="filter-group">
              <label className="input-label" htmlFor="auth-name">Full Name *</label>
              <div style={{ position: "relative" }}>
                <input
                  id="auth-name"
                  type="text"
                  placeholder="e.g. John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="text-input"
                  style={{ paddingLeft: "40px" }}
                  disabled={loading}
                  required
                />
                <User size={16} style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "var(--color-text-muted)" }} />
              </div>
            </div>
          )}

          {/* Email Field */}
          <div className="filter-group">
            <label className="input-label" htmlFor="auth-email">Email Address *</label>
            <div style={{ position: "relative" }}>
              <input
                id="auth-email"
                type="email"
                placeholder="e.g. yourname@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="text-input"
                style={{ paddingLeft: "40px" }}
                disabled={loading}
                required
              />
              <Envelope size={16} style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "var(--color-text-muted)" }} />
            </div>
          </div>

          {/* Password Field */}
          <div className="filter-group">
            <label className="input-label" htmlFor="auth-password">Password *</label>
            <div style={{ position: "relative" }}>
              <input
                id="auth-password"
                type="password"
                placeholder="Min. 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="text-input"
                style={{ paddingLeft: "40px" }}
                disabled={loading}
                required
              />
              <Lock size={16} style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "var(--color-text-muted)" }} />
            </div>
          </div>

          {/* Submit button */}
          <button 
            type="submit" 
            className="btn-form-submit" 
            style={{ width: "100%", justifyContent: "center", marginTop: "10px" }}
            disabled={loading}
          >
            {loading ? (
              <>
                <CircleNotch size={18} className="animate-float" style={{ animation: "spin 1s linear infinite" }} />
                <span>Processing...</span>
              </>
            ) : isLogin ? (
              <>
                <SignIn size={18} weight="bold" />
                <span>Log In</span>
              </>
            ) : (
              <>
                <UserPlus size={18} weight="bold" />
                <span>Sign Up</span>
              </>
            )}
          </button>
        </form>

        <div style={{ display: "flex", alignItems: "center", margin: "24px 0 16px 0", color: "var(--color-text-muted)", fontSize: "12px" }}>
          <div style={{ flex: 1, height: "1px", background: "rgba(255,255,255,0.08)" }}></div>
          <span style={{ padding: "0 10px" }}>OR</span>
          <div style={{ flex: 1, height: "1px", background: "rgba(255,255,255,0.08)" }}></div>
        </div>

        <button 
          type="button" 
          onClick={handleGoogleSignIn}
          style={{
            width: "100%",
            padding: "12px",
            borderRadius: "var(--radius-sm)",
            border: "1px solid rgba(255, 255, 255, 0.1)",
            background: "rgba(255, 255, 255, 0.03)",
            color: "var(--color-text-secondary)",
            fontWeight: 600,
            fontSize: "14px",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "10px",
            transition: "all 0.15s ease",
          }}
          disabled={loading}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
          </svg>
          <span>Continue with Google</span>
        </button>

        {/* Toggle between Log In / Sign Up */}
        <div style={{
          marginTop: "24px",
          textAlign: "center",
          borderTop: "1px solid rgba(255, 255, 255, 0.05)",
          paddingTop: "20px",
          fontSize: "14px",
          color: "var(--color-text-secondary)"
        }}>
          {isLogin ? (
            <span>
              Don't have an account?{" "}
              <button 
                type="button" 
                onClick={() => { setIsLogin(false); setError(""); setSuccessMsg(""); }}
                style={{ background: "none", border: "none", color: "var(--color-pink)", fontWeight: 600, cursor: "pointer" }}
                disabled={loading}
              >
                Sign Up
              </button>
            </span>
          ) : (
            <span>
              Already have an account?{" "}
              <button 
                type="button" 
                onClick={() => { setIsLogin(true); setError(""); setSuccessMsg(""); }}
                style={{ background: "none", border: "none", color: "var(--color-pink)", fontWeight: 600, cursor: "pointer" }}
                disabled={loading}
              >
                Log In
              </button>
            </span>
          )}
        </div>

        {/* Add spin animation keyframes inline if not present */}
        <style dangerouslySetInnerHTML={{__html: `
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}} />

      </div>
    </div>
  );
}
