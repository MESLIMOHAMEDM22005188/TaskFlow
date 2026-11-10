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
    const [showRecovery, setShowRecovery] = useState(false);
    const [recoveryEmail, setRecoveryEmail] = useState("");
    const [recoveryChallenge, setRecoveryChallenge] = useState("");
    const [challengeId, setChallengeId] = useState("");
    const [recoveryAnswer, setRecoveryAnswer] = useState("");
    const [recoveryPassword, setRecoveryPassword] = useState("");
    const [recoveryMessage, setRecoveryMessage] = useState("");
    const [recoveryLoading, setRecoveryLoading] = useState(false);


    const startRecovery = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setRecoveryMessage("");
        setRecoveryLoading(true);
        try {
            const response = await api.post("/auth/forgot-password/challenge", { email: recoveryEmail.trim() });
            setRecoveryChallenge(response.data.challenge || "");
            setChallengeId(response.data.challengeId || "");
            setRecoveryMessage(response.data.message || "La récupération par e-mail n'est pas disponible.");
        } catch (err: any) {
            setRecoveryMessage(err?.response?.data?.message || "Impossible de préparer la récupération.");
        } finally {
            setRecoveryLoading(false);
        }
    };

    const submitRecovery = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setRecoveryMessage("");
        setRecoveryLoading(true);
        try {
            const response = await api.post("/auth/forgot-password/reset", {
                email: recoveryEmail.trim(),
                challengeId,
                answer: recoveryAnswer,
                newPassword: recoveryPassword
            });
            setRecoveryMessage(response.data.message || "Demande traitée.");
        } catch (err: any) {
            setRecoveryMessage(err?.response?.data?.message || "La réinitialisation n'a pas pu être effectuée.");
        } finally {
            setRecoveryLoading(false);
        }
    };

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

                    <div className="auth-recovery-row"><button type="button" className="auth-link-button" onClick={() => { setShowRecovery(value => !value); setRecoveryEmail(email); setRecoveryMessage(""); }}>Mot de passe oublié ?</button></div>

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

                {showRecovery && (
                    <section className="auth-card auth-recovery-card" aria-label="Récupération du mot de passe">
                        <div className="auth-card-heading">
                            <span className="auth-card-kicker">RÉCUPÉRER TON COMPTE</span>
                            <h2>Mot de passe oublié ?</h2>
                            <p>Saisis l’adresse e-mail associée à ton compte.</p>
                        </div>
                        <form onSubmit={startRecovery} className="auth-recovery-form">
                            <label className="auth-label" htmlFor="recovery-email">Adresse e-mail</label>
                            <input id="recovery-email" className="auth-input" type="email" autoComplete="email" required value={recoveryEmail} onChange={event => setRecoveryEmail(event.target.value)} />
                            <button className="auth-button" type="submit" disabled={recoveryLoading}>{recoveryLoading ? "Préparation…" : "Continuer"}</button>
                        </form>
                        {recoveryChallenge && (
                            <form onSubmit={submitRecovery} className="auth-recovery-form">
                                <div className="auth-recovery-challenge"><span>Vérification de sécurité</span><strong>{recoveryChallenge} = ?</strong></div>
                                <label className="auth-label" htmlFor="recovery-answer">Résultat du calcul</label>
                                <input id="recovery-answer" className="auth-input" inputMode="numeric" pattern="[0-9]*" required value={recoveryAnswer} onChange={event => setRecoveryAnswer(event.target.value)} />
                                <label className="auth-label" htmlFor="recovery-new-password">Nouveau mot de passe</label>
                                <input id="recovery-new-password" className="auth-input" type="password" autoComplete="new-password" minLength={8} required value={recoveryPassword} onChange={event => setRecoveryPassword(event.target.value)} />
                                <p className="auth-legal">8 caractères minimum, avec une majuscule, une minuscule et un chiffre.</p>
                                <button className="auth-button" type="submit" disabled={recoveryLoading}>{recoveryLoading ? "Vérification…" : "Valider"}</button>
                            </form>
                        )}
                        {recoveryMessage && <div className="auth-alert" role="status">{recoveryMessage}</div>}
                    </section>
                )}
            </section>
            <footer className="auth-footer">GRINDLY <span>·</span> TES OBJECTIFS, UN JOUR À LA FOIS</footer>
        </main>
    );
}
