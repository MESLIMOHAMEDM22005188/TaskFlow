import { useNavigate } from "react-router-dom";
import type {CSSProperties} from "react";

export function AuthChoice() {
    const navigate = useNavigate();

    return (
        <div style={container}>
            <h1 style={title}>TaskFlow</h1>

            <p style={subtitle}>
                Organise tes tâches simplement
            </p>

            <div style={buttons}>
                <button
                    style={login}
                    onClick={() => navigate("/login")}
                >
                    Login
                </button>

                <button
                    style={signup}
                    onClick={() => navigate("/signup")}
                >
                    Sign up
                </button>
            </div>
        </div>
    );
}

// ✅ typage propre (évite erreurs TS)
const container: CSSProperties = {
    height: "100vh",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    background: "#0f172a",
    color: "white"
};

const title: CSSProperties = {
    fontSize: "48px",
    marginBottom: "10px"
};

const subtitle: CSSProperties = {
    marginBottom: "40px",
    opacity: 0.8
};

const buttons: CSSProperties = {
    display: "flex",
    gap: "20px"
};

const baseButton: CSSProperties = {
    padding: "12px 30px",
    borderRadius: "8px",
    border: "none",
    fontSize: "16px",
    cursor: "pointer",
    transition: "0.2s ease"
};

const login: CSSProperties = {
    ...baseButton,
    background: "#2563eb",
    color: "white"
};

const signup: CSSProperties = {
    ...baseButton,
    background: "#16a34a",
    color: "white"
};