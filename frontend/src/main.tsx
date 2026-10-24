import React, { Component, type ErrorInfo, type ReactNode } from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";

type BoundaryState = {
    hasError: boolean;
    message: string;
};

class AppErrorBoundary extends Component<{ children: ReactNode }, BoundaryState> {
    state: BoundaryState = { hasError: false, message: "" };

    static getDerivedStateFromError(error: unknown): BoundaryState {
        return {
            hasError: true,
            message: error instanceof Error ? error.message : "Erreur inattendue dans l’interface.",
        };
    }

    componentDidCatch(error: Error, info: ErrorInfo) {
        console.error("[Grindly] Erreur d’affichage récupérée :", error, info.componentStack);
    }

    private reload = () => {
        window.location.reload();
    };

    private goHome = () => {
        window.location.assign("/login");
    };

    render() {
        if (this.state.hasError) {
            return (
                <main style={{
                    minHeight: "100vh",
                    display: "grid",
                    placeItems: "center",
                    padding: 24,
                    boxSizing: "border-box",
                    background: "var(--bg, #0b1020)",
                    color: "var(--text, #f8fafc)",
                    fontFamily: "Inter, system-ui, sans-serif",
                }}>
                    <section style={{
                        width: "min(100%, 520px)",
                        padding: 28,
                        borderRadius: 20,
                        border: "1px solid rgba(148,163,184,.25)",
                        background: "var(--bg-card, rgba(255,255,255,.05))",
                        boxSizing: "border-box",
                    }}>
                        <p style={{ marginTop: 0, color: "#f87171", fontWeight: 700 }}>Grindly a rencontré une erreur</p>
                        <h1 style={{ fontSize: 26, margin: "0 0 12px" }}>L’interface n’a pas pu s’afficher.</h1>
                        <p style={{ opacity: .8, lineHeight: 1.6 }}>
                            Tes données enregistrées ne sont pas supprimées. Recharge la page. Si le problème revient,
                            retourne à la connexion puis réessaie.
                        </p>
                        <details style={{ margin: "16px 0", opacity: .8 }}>
                            <summary>Détail technique</summary>
                            <pre style={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}>{this.state.message}</pre>
                        </details>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
                            <button type="button" onClick={this.reload} style={buttonStyle}>Recharger</button>
                            <button type="button" onClick={this.goHome} style={{ ...buttonStyle, background: "transparent" }}>Retour à la connexion</button>
                        </div>
                    </section>
                </main>
            );
        }

        return this.props.children;
    }
}

const buttonStyle: React.CSSProperties = {
    cursor: "pointer",
    border: "1px solid rgba(148,163,184,.35)",
    borderRadius: 10,
    padding: "11px 15px",
    color: "inherit",
    background: "var(--accent, #6366f1)",
    font: "inherit",
};

const rootElement = document.getElementById("root");

if (!rootElement) {
    throw new Error('Élément #root introuvable dans frontend/index.html');
}

ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
        <AppErrorBoundary>
            <BrowserRouter>
                <App />
            </BrowserRouter>
        </AppErrorBoundary>
    </React.StrictMode>
);
