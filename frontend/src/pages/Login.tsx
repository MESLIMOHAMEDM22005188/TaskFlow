import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../services/api";
import AuthThemeToggle from "../components/AuthThemeToggle";
import "../assets/css/auth.css";

export default function Login() {
    const navigate = useNavigate();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError("");
        setLoading(true);
        try {
            const res = await api.post("/auth/login", { email: email.trim(), password });
            if (!res.data?.token) {
                setError("La connexion a échoué : aucun jeton de session n’a été reçu.");
                return;
            }
            localStorage.setItem("token", res.data.token);
            navigate("/dashboard", { replace: true });
        } catch (err: any) {
            const status = err?.response?.status;
            const message = err?.response?.data?.message;
            setError(status === 401
                ? "Adresse e-mail ou mot de passe incorrect."
                : message || "Impossible de se connecter pour le moment. Réessaie dans quelques instants.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="auth-screen">
            <div className="auth-orb auth-orb-one" aria-hidden="true" />
            <div className="auth-orb auth-orb-two" aria-hidden="true" />
            <header className="auth-topbar">
                <Link to="/" className="auth-brand" aria-label="Accueil Grindly"><span className="auth-brand-mark">G</span> grindly</Link>
                <AuthThemeToggle />
            </header>

            <section className="auth-layout">
                <aside className="auth-intro">
                    <span className="auth-eyebrow"><span className="auth-eyebrow-dot" /> TON ESPACE, TON RYTHME</span>
                    <h1>Chaque jour compte<span>.</span></h1>
                    <p>Retrouve tes objectifs, tes habitudes et tes progrès. Reprends là où tu t’es arrêté.</p>
                    <div className="auth-proof">
                        <div className="auth-proof-icon">↗</div>
                        <div><strong>Avance à ton rythme</strong><span>Un petit pas après l’autre.</span></div>
                    </div>
                </aside>

                <form className="auth-card" onSubmit={handleSubmit}>
                    <div className="auth-card-heading">
                        <span className="auth-card-kicker">RAVI DE TE REVOIR</span>
                        <h2>Connexion</h2>
                        <p>Connecte-toi pour continuer ton parcours.</p>
                    </div>

                    {error && <div className="auth-alert" role="alert">{error}</div>}

                    <label className="auth-label" htmlFor="login-email">Adresse e-mail</label>
                    <input
                        id="login-email"
                        className="auth-input"
                        type="email"
                        name="email"
                        autoComplete="email"
                        placeholder="toi@exemple.fr"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />

                    <label className="auth-label" htmlFor="login-password">Mot de passe</label>
                    <input
                        id="login-password"
                        className="auth-input"
                        type="password"
                        name="password"
                        autoComplete="current-password"
                        placeholder="Ton mot de passe"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />

                    <button className="auth-button" type="submit" disabled={loading}>
                        {loading ? <><span className="auth-spinner" /> Connexion en cours…</> : <>Se connecter <span aria-hidden="true">→</span></>}
                    </button>

                    <p className="auth-switch">Tu n’as pas encore de compte ? <Link to="/signup">Créer un compte</Link></p>
                    <p className="auth-legal">En continuant, tu accèdes à ton espace personnel Grindly.</p>
                </form>
            </section>
            <footer className="auth-footer">GRINDLY <span>·</span> TES OBJECTIFS, UN JOUR À LA FOIS</footer>
        </main>
    );
}
