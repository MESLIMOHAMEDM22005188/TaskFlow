import { useState, type FormEvent } from "react";
import { Link, useSearchParams } from "react-router-dom";
import api from "../services/api";
import AuthThemeToggle from "../components/AuthThemeToggle";
import "../assets/css/auth.css";

export default function PasswordRecovery() {
    const [params] = useSearchParams();
    const token = params.get("token") || "";
    const isReset = window.location.pathname === "/reset-password";
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirm, setConfirm] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    async function submit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setError("");
        setSuccess("");
        if (isReset && password !== confirm) {
            setError("Les mots de passe ne correspondent pas.");
            return;
        }
        if (isReset && (password.length < 8 || !/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/\d/.test(password))) {
            setError("Utilise au moins 8 caractères, une majuscule, une minuscule et un chiffre.");
            return;
        }
        setLoading(true);
        try {
            const response = isReset
                ? await api.post("/auth/reset-password", { token, password })
                : await api.post("/auth/forgot-password", { email: email.trim() });
            setSuccess(response.data?.message || "Demande prise en compte.");
            setPassword("");
            setConfirm("");
        } catch (err: unknown) {
            const response = err as { response?: { data?: { message?: string } } };
            setError(response.response?.data?.message || "Une erreur est survenue. Réessaie.");
        } finally {
            setLoading(false);
        }
    }

    return (
        <main className="auth-screen">
            <div className="auth-orb auth-orb-one" aria-hidden="true" />
            <div className="auth-orb auth-orb-two" aria-hidden="true" />
            <header className="auth-topbar">
                <Link to="/" className="auth-brand"><span className="auth-brand-mark">G</span> grindly</Link>
                <AuthThemeToggle />
            </header>
            <section className="auth-layout">
                <aside className="auth-intro">
                    <span className="auth-eyebrow">SÉCURITÉ DU COMPTE</span>
                    <h1>Retrouve ton accès<span>.</span></h1>
                    <p>Un lien sécurisé, valable 30 minutes, pour reprendre là où tu en étais.</p>
                </aside>
                <form className="auth-card" onSubmit={submit}>
                    <div className="auth-card-heading">
                        <span className="auth-card-kicker">GRINDLY</span>
                        <h2>{isReset ? "Nouveau mot de passe" : "Mot de passe oublié ?"}</h2>
                        <p>{isReset ? "Choisis un nouveau mot de passe pour ton compte." : "Entre ton adresse e-mail pour recevoir un lien de réinitialisation."}</p>
                    </div>
                    {error && <div className="auth-alert" role="alert">{error}</div>}
                    {success && <div className="auth-success" role="status">{success}</div>}
                    {isReset ? (
                        token ? (
                            <>
                                <label className="auth-label" htmlFor="reset-password">Nouveau mot de passe</label>
                                <input className="auth-input" id="reset-password" type="password" autoComplete="new-password" minLength={8} required value={password} onChange={event => setPassword(event.target.value)} />
                                <label className="auth-label" htmlFor="reset-confirm">Confirmer le mot de passe</label>
                                <input className="auth-input" id="reset-confirm" type="password" autoComplete="new-password" minLength={8} required value={confirm} onChange={event => setConfirm(event.target.value)} />
                            </>
                        ) : <div className="auth-alert" role="alert">Lien manquant ou invalide. Demande un nouveau lien.</div>
                    ) : (
                        <>
                            <label className="auth-label" htmlFor="recovery-email">Adresse e-mail</label>
                            <input className="auth-input" id="recovery-email" type="email" autoComplete="email" required value={email} onChange={event => setEmail(event.target.value)} placeholder="toi@exemple.fr" />
                        </>
                    )}
                    {(!isReset || token) && !success && <button className="auth-button" type="submit" disabled={loading}>{loading ? "Envoi en cours…" : isReset ? "Modifier mon mot de passe" : "Recevoir le lien"}</button>}
                    <p className="auth-switch"><Link to="/login">Retour à la connexion</Link></p>
                    {isReset && <p className="auth-switch"><Link to="/forgot-password">Demander un nouveau lien</Link></p>}
                </form>
            </section>
            <footer className="auth-footer">GRINDLY <span>·</span> TES OBJECTIFS, UN JOUR À LA FOIS</footer>
        </main>
    );
}
