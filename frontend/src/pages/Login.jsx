import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";

export default function Login() {
  const { loginWithGoogle, user } = useAuth();
  const navigate = useNavigate();
  const btnRef = useRef(null);

  useEffect(() => {
    if (user) {
      navigate("/");
      return;
    }
    if (!window.google) return;
    window.google.accounts.id.initialize({
      client_id:
        "714616944193-19p7crvq3p7mn0gvbt4qpejcbod3197u.apps.googleusercontent.com",
      callback: async ({ credential }) => {
        try {
          await loginWithGoogle(credential);
          navigate("/today");
        } catch {
          toast.error("Login failed");
        }
      },
    });
    window.google.accounts.id.renderButton(btnRef.current, {
      theme: "filled_black",
      size: "large",
      width: 280,
      text: "continue_with",
    });
  }, []);

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--bg)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
      }}
    >
      {/* Ambient blobs */}
      <div
        style={{
          position: "fixed",
          top: "15%",
          left: "20%",
          width: 400,
          height: 400,
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(124,106,247,0.12) 0%, transparent 70%)",
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          position: "fixed",
          bottom: "15%",
          right: "20%",
          width: 320,
          height: 320,
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(247,150,106,0.1) 0%, transparent 70%)",
          pointerEvents: "none",
        }}
      />

      <div
        className="glass fade-up"
        style={{
          maxWidth: 420,
          width: "100%",
          padding: "48px 40px",
          textAlign: "center",
        }}
      >
        <div style={{ fontSize: 48, marginBottom: 16 }}>🔥</div>
        <h1
          style={{
            fontFamily: "Syne, system-ui",
            fontSize: 36,
            fontWeight: 800,
            marginBottom: 8,
          }}
        >
          <span className="grad-text">Habitual</span>
        </h1>
        <p
          style={{
            color: "var(--muted)",
            fontSize: 15,
            marginBottom: 40,
            lineHeight: 1.6,
          }}
        >
          Build streaks. Track cycles. Become who
          <br />
          you're meant to be — one day at a time.
        </p>

        <div
          style={{
            display: "flex",
            gap: 20,
            justifyContent: "center",
            marginBottom: 36,
            flexWrap: "wrap",
          }}
        >
          {[
            ["🎯", "Daily Tracking"],
            ["📈", "Cycle History"],
            ["🧠", "AI Insights"],
            ["🏆", "Gamification"],
          ].map(([icon, label]) => (
            <div
              key={label}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 6,
              }}
            >
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 12,
                  background: "rgba(124,106,247,0.1)",
                  border: "1px solid rgba(124,106,247,0.2)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 20,
                }}
              >
                {icon}
              </div>
              <span
                style={{ fontSize: 11, color: "var(--muted)", fontWeight: 500 }}
              >
                {label}
              </span>
            </div>
          ))}
        </div>

        <div
          ref={btnRef}
          style={{ display: "flex", justifyContent: "center" }}
        />

        <p style={{ marginTop: 24, fontSize: 12, color: "var(--muted)" }}>
          By continuing, you agree to our Terms & Privacy Policy.
        </p>
      </div>
    </div>
  );
}
