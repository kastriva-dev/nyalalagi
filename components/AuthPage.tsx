"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { LockKeyhole, Mail, UserPlus, LogIn, ArrowLeft, Loader2, ShieldCheck, KeyRound, Phone, Camera, LocateFixed } from "lucide-react";
import { createUserWithEmailAndPassword, onAuthStateChanged, sendPasswordResetEmail, signInWithEmailAndPassword } from "firebase/auth";
import { auth, db, firebaseReady } from "@/lib/firebase";
import { createCustomerProfile } from "@/lib/user";
import { useRouter } from "next/navigation";

export default function AuthPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "register" | "forgot">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [authReady, setAuthReady] = useState(false);

  useEffect(() => {
    if (!firebaseReady) {
      setAuthReady(true);
      return;
    }
    const unsubscribe = onAuthStateChanged(auth!, (user) => {
      if (user && !user.isAnonymous) {
        router.push("/");
      }
      setAuthReady(true);
    });
    return () => unsubscribe();
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await signInWithEmailAndPassword(auth!, email, password);
      router.push("/");
    } catch (err: any) {
      setError(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth!, email, password);
      await createCustomerProfile(userCredential.user, {
        name,
        phone_number: phone,
        address: "",
        province: "",
        city: "",
        subdistrict: "",
      });
      setSuccess("Registration successful! Redirecting...");
      setTimeout(() => router.push("/"), 2000);
    } catch (err: any) {
      setError(err.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await sendPasswordResetEmail(auth!, email);
      setSuccess("Password reset email sent. Check your inbox.");
      setTimeout(() => setMode("login"), 2000);
    } catch (err: any) {
      setError(err.message || "Failed to send reset email");
    } finally {
      setLoading(false);
    }
  };

  if (!authReady) {
    return (
      <div className="hero">
        <div className="loading">
          <span></span>
          <span></span>
          <span></span>
        </div>
      </div>
    );
  }

  return (
    <div className="hero" style={{ minHeight: "100vh" }}>
      <div className="container" style={{ maxWidth: "480px" }}>
        <div className="glass-card" style={{ padding: "var(--space-3xl)" }}>
          {/* Header */}
          <div style={{ textAlign: "center", marginBottom: "var(--space-3xl)" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "var(--space-md)",
                marginBottom: "var(--space-lg)",
              }}
            >
              <Zap size={32} style={{ color: "var(--accent-blue)" }} />
              <h1 style={{ fontSize: "1.75rem", margin: 0 }}>NyalaLagi</h1>
            </div>
            <p style={{ color: "var(--gray-400)", margin: 0 }}>
              Platform Perbaikan Kelistrikan Terpercaya
            </p>
          </div>

          {/* Tabs */}
          <div
            style={{
              display: "flex",
              gap: "var(--space-md)",
              marginBottom: "var(--space-2xl)",
              borderBottom: "1px solid var(--glass-border)",
              paddingBottom: "var(--space-lg)",
            }}
          >
            <button
              onClick={() => setMode("login")}
              className={`btn btn-ghost ${mode === "login" ? "active" : ""}`}
              style={{
                flex: 1,
                borderBottom: mode === "login" ? "2px solid var(--accent-blue)" : "none",
                paddingBottom: "var(--space-md)",
                backgroundColor: "transparent",
              }}
            >
              <LogIn size={18} />
              Login
            </button>
            <button
              onClick={() => setMode("register")}
              className={`btn btn-ghost ${mode === "register" ? "active" : ""}`}
              style={{
                flex: 1,
                borderBottom: mode === "register" ? "2px solid var(--accent-blue)" : "none",
                paddingBottom: "var(--space-md)",
                backgroundColor: "transparent",
              }}
            >
              <UserPlus size={18} />
              Register
            </button>
          </div>

          {/* Error Message */}
          {error && (
            <div className="alert alert-error" style={{ marginBottom: "var(--space-lg)" }}>
              <span>{error}</span>
            </div>
          )}

          {/* Success Message */}
          {success && (
            <div className="alert alert-success" style={{ marginBottom: "var(--space-lg)" }}>
              <span>{success}</span>
            </div>
          )}

          {/* Login Form */}
          {mode === "login" && (
            <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: "var(--space-lg)" }}>
              <div className="form-group">
                <label className="form-label">
                  <Mail size={16} style={{ display: "inline", marginRight: "var(--space-sm)" }} />
                  Email
                </label>
                <input
                  type="email"
                  className="form-input"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">
                  <LockKeyhole size={16} style={{ display: "inline", marginRight: "var(--space-sm)" }} />
                  Password
                </label>
                <input
                  type="password"
                  className="form-input"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              <button type="submit" className="btn btn-primary" disabled={loading} style={{ width: "100%" }}>
                {loading ? (
                  <>
                    <Loader2 size={18} style={{ animation: "spin 1s linear infinite" }} />
                    Logging in...
                  </>
                ) : (
                  <>
                    <LogIn size={18} />
                    Login
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => setMode("forgot")}
                className="btn btn-ghost"
                style={{ width: "100%" }}
              >
                Forgot Password?
              </button>
            </form>
          )}

          {/* Register Form */}
          {mode === "register" && (
            <form
              onSubmit={handleRegister}
              style={{ display: "flex", flexDirection: "column", gap: "var(--space-lg)" }}
            >
              <div className="form-group">
                <label className="form-label">Name</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Your Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Email</label>
                <input
                  type="email"
                  className="form-input"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Phone</label>
                <input
                  type="tel"
                  className="form-input"
                  placeholder="+62..."
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Password</label>
                <input
                  type="password"
                  className="form-input"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Confirm Password</label>
                <input
                  type="password"
                  className="form-input"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>

              <button type="submit" className="btn btn-primary" disabled={loading} style={{ width: "100%" }}>
                {loading ? (
                  <>
                    <Loader2 size={18} style={{ animation: "spin 1s linear infinite" }} />
                    Creating account...
                  </>
                ) : (
                  <>
                    <UserPlus size={18} />
                    Create Account
                  </>
                )}
              </button>
            </form>
          )}

          {/* Forgot Password Form */}
          {mode === "forgot" && (
            <form
              onSubmit={handleForgotPassword}
              style={{ display: "flex", flexDirection: "column", gap: "var(--space-lg)" }}
            >
              <p style={{ color: "var(--gray-400)", marginBottom: "var(--space-lg)" }}>
                Enter your email address and we'll send you a link to reset your password.
              </p>

              <div className="form-group">
                <label className="form-label">Email</label>
                <input
                  type="email"
                  className="form-input"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <button type="submit" className="btn btn-primary" disabled={loading} style={{ width: "100%" }}>
                {loading ? "Sending..." : "Send Reset Link"}
              </button>

              <button
                type="button"
                onClick={() => setMode("login")}
                className="btn btn-ghost"
                style={{ width: "100%" }}
              >
                <ArrowLeft size={18} />
                Back to Login
              </button>
            </form>
          )}

          {/* Footer */}
          <div style={{ textAlign: "center", marginTop: "var(--space-2xl)", paddingTop: "var(--space-2xl)", borderTop: "1px solid var(--glass-border)" }}>
            <p style={{ fontSize: "0.875rem", color: "var(--gray-400)" }}>
              {mode === "login" ? "Don't have an account? " : "Already have an account? "}
              <button
                onClick={() => setMode(mode === "login" ? "register" : "login")}
                style={{
                  background: "none",
                  border: "none",
                  color: "var(--accent-blue)",
                  cursor: "pointer",
                  fontWeight: "600",
                }}
              >
                {mode === "login" ? "Register here" : "Login here"}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

import { Zap } from "lucide-react";
