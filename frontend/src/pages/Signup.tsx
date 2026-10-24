import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../services/api";
import AuthThemeToggle from "../components/AuthThemeToggle";
import "../assets/css/auth.css";

export default function Signup() {
    const navigate = useNavigate();
    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const handleSignup = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError("");
        setSuccess("");
        if (password.length < 8) {
            setError("Choisis un mot de passe d’au moins 8 caractères.");
            return;
        }
        if (password !== confirmPassword) {
            setError("Les deux mots de passe ne correspondent pas.");
            return;
        }

        setLoading(true);
        try {
            await api.post("/auth/signup", { username: username.trim(), email: email.trim(), password });
            setSuccess("Ton compte a été créé. Tu vas être redirigé vers la connexion…");
            window.setTimeout(() => navigate("/login", { replace: true }), 900);
        } catch (err: any) {
            const message = err?.response?.data?.message;
            setError(message || "Impossible de créer le compte pour le moment. Vérifie les informations et réessaie.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="auth-screen auth-screen-signup">
            <div className="auth-orb auth-orb-one" aria-hidden="true" />
            <div className="auth-orb auth-orb-two" aria-hidden="true" />
            <header className="auth-topbar">
                <Link to="/" className="auth-brand" aria-label="Accueil Grindly"><span className="auth-brand-mark">G</span> grindly</Link>
                <AuthThemeToggle />
            </header>

            <section className="auth-layout auth-layout-signup">
                <aside className="auth-intro">
                    <span className="auth-eyebrow"><span className="auth-eyebrow-dot" /> LE DÉBUT DE QUELQUE CHOSE</span>
                    <h1>Construis la suite<span>.</span></h1>
                    <p>Transforme tes intentions en habitudes, suis tes avancées et célèbre chaque étape.</p>
                    <div className="auth-benefits">
                        <div><span>01</span><p><strong>Organise tes journées</strong><small>Rassemble tes tâches au même endroit.</small></p></div>
                        <div><span>02</span><p><strong>Garde le cap</strong><small>Fais vivre tes objectifs au quotidien.</small></p></div>
                        <div><span>03</span><p><strong>Vois tes progrès</strong><small>Chaque effort compte.</small></p></div>
                    </div>
                </aside>

                <form className="auth-card auth-card-signup" onSubmit={handleSignup}>
                    <div className="auth-card-heading">
                        <span className="auth-card-kicker">COMMENCE AUJOURD’HUI</span>
                        <h2>Créer un compte</h2>
                        <p>Quelques informations et c’est parti.</p>
                    </div>

                    {error && <div className="auth-alert" role="alert">{error}</div>}
                    {success && <div className="auth-success" role="status">{success}</div>}

                    <label className="auth-label" htmlFor="signup-username">Nom d’utilisateur</label>
                    <input
                        id="signup-username"
                        className="auth-input"
                        type="text"
                        name="username"
                        autoComplete="username"
                        placeholder="Comment doit-on t’appeler ?"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        minLength={2}
                        maxLength={40}
                        required
                    />

                    <label className="auth-label" htmlFor="signup-email">Adresse e-mail</label>
                    <input
                        id="signup-email"
                        className="auth-input"
                        type="email"
                        name="email"
                        autoComplete="email"
                        placeholder="toi@exemple.fr"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />

                    <label className="auth-label" htmlFor="signup-password">Mot de passe</label>
                    <input
                        id="signup-password"
                        className="auth-input"
                        type={showPassword ? "text" : "password"}
                        name="new-password"
                        autoComplete="new-password"
                        placeholder="8 caractères minimum"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        minLength={8}
                        required
                    />

                    <label className="auth-label" htmlFor="signup-confirm-password">Confirmer le mot de passe</label>
                    <input
                        id="signup-confirm-password"
                        className="auth-input"
                        id="signup-confirm-password"
                        type={showPassword ? "text" : "password"}
                        autoComplete="new-password"
                        placeholder="Saisis à nouveau le mot de passe"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        minLength={8}
                        required
                    />
                    <label className="auth-show-password"><input type="checkbox" checked={showPassword} onChange={(e) => setShowPassword(e.target.checked)} /> Afficher les mots de passe</label>

                    <button className="auth-button" type="submit" disabled={loading}>
                        {loading ? <><span className="auth-spinner" /> Création en cours…</> : <>Créer mon compte <span aria-hidden="true">→</span></>}
                    </button>

                    <p className="auth-switch">Tu as déjà un compte ? <Link to="/login">Se connecter</Link></p>
                    <p className="auth-legal">Tes informations servent à créer et sécuriser ton espace Grindly.</p>
                </form>
            </section>
            <footer className="auth-footer">GRINDLY <span>·</span> TES OBJECTIFS, UN JOUR À LA FOIS</footer>
        </main>
    );
}
