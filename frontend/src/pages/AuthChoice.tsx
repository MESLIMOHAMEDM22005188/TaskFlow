import { Link } from "react-router-dom";
import AuthThemeToggle from "../components/AuthThemeToggle";
import "../assets/css/auth.css";

export function AuthChoice() {
    return (
        <main className="auth-screen auth-choice-screen">
            <div className="auth-orb auth-orb-one" aria-hidden="true" />
            <div className="auth-orb auth-orb-two" aria-hidden="true" />
            <header className="auth-topbar">
                <Link to="/" className="auth-brand" aria-label="Accueil Grindly"><span className="auth-brand-mark">G</span> grindly</Link>
                <AuthThemeToggle />
            </header>
            <section className="auth-choice-content">
                <span className="auth-eyebrow"><span className="auth-eyebrow-dot" /> FAÇONNE TON QUOTIDIEN</span>
                <h1>Moins d’intentions.<br />Plus d’<span>actions.</span></h1>
                <p>Organise tes tâches, construis des habitudes durables et avance vers tes objectifs, un jour à la fois.</p>
                <div className="auth-choice-actions">
                    <Link to="/signup" className="auth-choice-primary">Créer mon compte <span aria-hidden="true">→</span></Link>
                    <Link to="/login" className="auth-choice-secondary">J’ai déjà un compte</Link>
                </div>
                <div className="auth-choice-note"><span>✓</span> Ton espace personnel pour suivre tes progrès.</div>
            </section>
            <footer className="auth-footer">GRINDLY <span>·</span> TES OBJECTIFS, UN JOUR À LA FOIS</footer>
        </main>
    );
}
