import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../services/api";
import AuthThemeToggle from "../components/AuthThemeToggle";
import "../assets/css/auth.css";

export default function ForgotPassword() {
    const navigate = useNavigate();
    const [username, setUsername] = useState("");
    const [challenge, setChallenge] = useState("");
    const [challengeId, setChallengeId] = useState("");
    const [answer, setAnswer] = useState("");
    const [flowId, setFlowId] = useState("");
    const [code, setCode] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [step, setStep] = useState(0);
    const [message, setMessage] = useState("");
    const [loading, setLoading] = useState(false);
    const [completed, setCompleted] = useState(false);

    const startRecovery = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setMessage("");
        setLoading(true);
        try {
            const response = await api.post("/auth/forgot-password/challenge", { username: username.trim() });
            setChallenge(response.data.challenge || "");
            setChallengeId(response.data.challengeId || "");
            setAnswer("");
            setStep(1);
            setMessage(response.data.message || "");
        } catch (error: any) {
            setMessage(error?.response?.data?.message || "Impossible de préparer la récupération.");
        } finally {
            setLoading(false);
        }
    };

    const sendCode = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setMessage("");
        setLoading(true);
        try {
            const response = await api.post("/auth/forgot-password/send-code", { challengeId, answer });
            setFlowId(response.data.flowId || "");
            setCode("");
            setStep(2);
            setMessage(response.data.message || "Vérifie la boîte mail associée à ton compte.");
        } catch (error: any) {
            setMessage(error?.response?.data?.message || "Impossible d'envoyer le code.");
        } finally {
            setLoading(false);
        }
    };

    const resetPassword = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setMessage("");
        setLoading(true);
        try {
            const response = await api.post("/auth/forgot-password/reset", {
                flowId,
                token: code.trim(),
                newPassword
            });
            setMessage(response.data.message || "Mot de passe modifié avec succès.");
            setCompleted(true);
            setStep(3);
            setNewPassword("");
            setCode("");
        } catch (error: any) {
            setMessage(error?.response?.data?.message || "La réinitialisation n'a pas pu être effectuée.");
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
                    <span className="auth-eyebrow"><span className="auth-eyebrow-dot" /> RÉCUPÉRATION DE COMPTE</span>
                    <h1>Un nouveau départ<span>.</span></h1>
                    <p>Réinitialise ton mot de passe en quelques étapes sécurisées.</p>
                    <div className="auth-proof">
                        <div className="auth-proof-icon">↗</div>
                        <div><strong>Ton compte reste protégé</strong><span>Une vérification est nécessaire avant toute modification.</span></div>
                    </div>
                </aside>
                <section className="auth-card auth-recovery-card" aria-label="Récupération du mot de passe">
                    <div className="auth-card-heading">
                        <span className="auth-card-kicker">RÉCUPÉRER TON COMPTE</span>
                        <h2>{completed ? "Mot de passe modifié" : "Mot de passe oublié ?"}</h2>
                        <p>{completed ? "Tu peux maintenant te connecter avec ton nouveau mot de passe." : "Retrouve ton compte avec ton pseudo TaskFlow."}</p>
                    </div>

                    {step === 0 && (
                        <form onSubmit={startRecovery} className="auth-recovery-form">
                            <label className="auth-label" htmlFor="recovery-username">Pseudo TaskFlow</label>
                            <input id="recovery-username" className="auth-input" type="text" autoComplete="username" minLength={3} maxLength={20} required value={username} onChange={event => setUsername(event.target.value)} />
                            <button className="auth-button" type="submit" disabled={loading}>{loading ? "Recherche…" : "Continuer"}</button>
                        </form>
                    )}

                    {step === 1 && (
                        <form onSubmit={sendCode} className="auth-recovery-form">
                            <div className="auth-recovery-challenge"><span>Vérification de sécurité</span><strong>{challenge} = ?</strong></div>
                            <label className="auth-label" htmlFor="recovery-answer">Résultat du calcul</label>
                            <input id="recovery-answer" className="auth-input" inputMode="numeric" pattern="[0-9]*" required value={answer} onChange={event => setAnswer(event.target.value)} />
                            <button className="auth-button" type="submit" disabled={loading}>{loading ? "Envoi…" : "Recevoir le code"}</button>
                        </form>
                    )}

                    {step === 2 && (
                        <form onSubmit={resetPassword} className="auth-recovery-form">
                            <p className="auth-legal">Si le compte existe, un code a été envoyé à l'adresse e-mail enregistrée.</p>
                            <label className="auth-label" htmlFor="recovery-code">Code reçu par e-mail</label>
                            <input id="recovery-code" className="auth-input" type="text" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6} required value={code} onChange={event => setCode(event.target.value)} />
                            <label className="auth-label" htmlFor="recovery-new-password">Nouveau mot de passe</label>
                            <input id="recovery-new-password" className="auth-input" type="password" autoComplete="new-password" minLength={8} required value={newPassword} onChange={event => setNewPassword(event.target.value)} />
                            <p className="auth-legal">8 caractères minimum, avec une majuscule, une minuscule et un chiffre.</p>
                            <button className="auth-button" type="submit" disabled={loading}>{loading ? "Vérification…" : "Réinitialiser le mot de passe"}</button>
                        </form>
                    )}

                    {message && <div className="auth-alert" role="status">{message}</div>}
                    {completed ? (
                        <p className="auth-switch"><button type="button" className="auth-link-button" onClick={() => navigate("/login", { replace: true })}>Retour à la connexion</button></p>
                    ) : (
                        <p className="auth-switch"><Link to="/login">Retour à la connexion</Link></p>
                    )}
                </section>
            </section>
            <footer className="auth-footer">GRINDLY <span>·</span> TES OBJECTIFS, UN JOUR À LA FOIS</footer>
        </main>
    );
}
