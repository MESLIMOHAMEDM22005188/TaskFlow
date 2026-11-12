import { useState } from "react";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import api from "../services/api";
import AuthThemeToggle from "../components/AuthThemeToggle";
import "../assets/css/auth.css";
import "../assets/css/email-verification.css";

type LocationState = { email?: string; emailSent?: boolean } | null;

export default function VerifyEmail() {
    const location = useLocation();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const locationState = location.state as LocationState;
    const locationEmail = locationState?.email || "";
    const [email, setEmail] = useState(locationEmail || searchParams.get("email") || "");
    const [code, setCode] = useState("");
    const [loading, setLoading] = useState(false);
    const [resending, setResending] = useState(false);
    const [error, setError] = useState("");
    const [message, setMessage] = useState(
        locationState?.emailSent === false
            ? "Ton compte a été créé, mais l’envoi du code n’a pas abouti. Utilise le bouton de renvoi ci-dessous."
            : locationState?.emailSent === true
                ? "Un code de vérification vient d’être envoyé. Pense à regarder les courriers indésirables."
                : ""
    );

    const handleVerify = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setError("");
        setMessage("");

        const normalizedEmail = email.trim().toLowerCase();
        if (!normalizedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
            setError("Saisis une adresse e-mail valide.");
            return;
        }
        if (!/^\d{6}$/.test(code)) {
            setError("Le code doit contenir exactement 6 chiffres.");
            return;
        }

        setLoading(true);
        try {
            await api.post("/auth/verify-email", { email: normalizedEmail, code });
            setMessage("Adresse e-mail vérifiée. Ton compte est maintenant activé.");
            window.setTimeout(() => navigate("/login", { replace: true, state: { email: normalizedEmail } }), 1200);
        } catch (err: any) {
            setError(err?.response?.data?.message || "Impossible de vérifier le code. Réessaie.");
        } finally {
            setLoading(false);
        }
    };

    const handleResend = async () => {
        setError("");
        setMessage("");
        const normalizedEmail = email.trim().toLowerCase();
        if (!normalizedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
            setError("Saisis d'abord une adresse e-mail valide.");
            return;
        }

        setResending(true);
        try {
            const response = await api.post("/auth/resend-verification", { email: normalizedEmail });
            setMessage(response.data?.message || "Si un compte en attente correspond à cette adresse, un nouveau code a été envoyé.");
        } catch (err: any) {
            setError(err?.response?.data?.message || "Impossible de renvoyer le code pour le moment.");
        } finally {
            setResending(false);
        }
    };

    return (
        <main className="auth-screen auth-screen-signup">
            <div className="auth-orb auth-orb-one" aria-hidden="true" />
            <div className="auth-orb auth-orb-two" aria-hidden="true" />
            <header className="auth-topbar">
                <Link to="/" className="auth-brand" aria-label="Accueil Grindly">
                    <span className="auth-brand-mark">G</span> grindly
                </Link>
                <AuthThemeToggle />
            </header>

            <section className="auth-layout verification-layout">
                <aside className="auth-intro">
                    <span className="auth-eyebrow"><span className="auth-eyebrow-dot" /> DERNIÈRE ÉTAPE</span>
                    <h1>Confirme ton adresse<span>.</span></h1>
                    <p>Un code à 6 chiffres permet de vérifier que cette adresse e-mail t'appartient.</p>
                    <div className="auth-proof">
                        <div className="auth-proof-icon">✉</div>
                        <div>
                            <strong>Regarde ta boîte mail</strong>
                            <span>Pense aussi à vérifier les courriers indésirables.</span>
                        </div>
                    </div>
                </aside>

                <form className="auth-card verification-card" onSubmit={handleVerify}>
                    <div className="auth-card-heading">
                        <span className="auth-card-kicker">VÉRIFICATION DU COMPTE</span>
                        <h2>Vérifier mon e-mail</h2>
                        <p>Entre le code envoyé à ton adresse e-mail.</p>
                    </div>

                    {error && <div className="auth-alert" role="alert">{error}</div>}
                    {message && <div className="auth-success" role="status">{message}</div>}

                    <label className="auth-label" htmlFor="verification-email">Adresse e-mail</label>
                    <input
                        id="verification-email"
                        className="auth-input"
                        type="email"
                        autoComplete="email"
                        autoCapitalize="none"
                        spellCheck={false}
                        maxLength={254}
                        value={email}
                        onChange={event => setEmail(event.target.value)}
                        required
                    />

                    <label className="auth-label" htmlFor="verification-code">Code de vérification</label>
                    <input
                        id="verification-code"
                        className="auth-input verification-code-input"
                        type="text"
                        inputMode="numeric"
                        autoComplete="one-time-code"
                        pattern="[0-9]{6}"
                        maxLength={6}
                        placeholder="000000"
                        value={code}
                        onChange={event => setCode(event.target.value.replace(/\D/g, "").slice(0, 6))}
                        required
                    />
                    <small className="auth-legal">Le code expire après 15 minutes. Tu disposes de 5 tentatives.</small>

                    <button className="auth-button" type="submit" disabled={loading}>
                        {loading ? <><span className="auth-spinner" /> Vérification…</> : <>Valider mon adresse <span aria-hidden="true">→</span></>}
                    </button>

                    <button className="verification-resend" type="button" onClick={() => void handleResend()} disabled={resending}>
                        {resending ? "Envoi en cours…" : "Je n'ai pas reçu le code · Renvoyer"}
                    </button>

                    <p className="auth-switch">Tu as déjà validé ton adresse ? <Link to="/login">Se connecter</Link></p>
                </form>
            </section>

            <footer className="auth-footer">GRINDLY <span>·</span> TES OBJECTIFS, UN JOUR À LA FOIS</footer>
        </main>
    );
}
