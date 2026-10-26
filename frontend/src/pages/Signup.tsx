import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../services/api";
import AuthThemeToggle from "../components/AuthThemeToggle";
import "../assets/css/auth.css";

const USERNAME_REGEX = /^[A-Za-z0-9_-]{3,20}$/;
const RESERVED_PREFIXES = [
    "admin", "administrator", "moderator", "mod", "support", "helpdesk",
    "staff", "owner", "root", "system", "security", "official", "webmaster",
    "api", "null", "undefined", "grindly"
];
const FALLBACK_FORBIDDEN_NAMES = [
    "pute", "putain", "salope", "connard", "connasse", "encule", "enculee",
    "merde", "fuck", "shit", "bitch", "asshole", "whore", "slut"
];

function normalizeUsername(value: string): string {
    return String(value).normalize("NFKD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .replace(/0/g, "o")
        .replace(/[1!|]/g, "i")
        .replace(/3/g, "e")
        .replace(/4/g, "a")
        .replace(/5/g, "s")
        .replace(/7/g, "t")
        .replace(/[^a-z0-9]/g, "");
}

function validateUsername(value: string): string {
    const username = value.trim();
    if (username.length < 3) return "Le pseudo doit contenir au moins 3 caractères.";
    if (username.length > 20) return "Le pseudo ne peut pas dépasser 20 caractères.";
    if (!USERNAME_REGEX.test(username)) return "Utilise uniquement des lettres sans accent, des chiffres, _ ou -, sans espaces.";
    const normalized = normalizeUsername(username);
    const words = username.toLowerCase().split(/[_-]+/).filter(Boolean).map(normalizeUsername);
    if (RESERVED_PREFIXES.some(name => normalized.startsWith(normalizeUsername(name)))) {
        return "Ce pseudo est réservé.";
    }
    if (FALLBACK_FORBIDDEN_NAMES.some(word =>
        normalized === normalizeUsername(word) ||
        words.includes(normalizeUsername(word)) ||
        (word.length >= 4 && normalized.startsWith(normalizeUsername(word)))
    )) {
        return "Ce pseudo contient un terme interdit. Choisis-en un autre.";
    }
    return "";
}

function validateEmail(value: string): string {
    const email = value.trim();
    if (email.length > 254 || email.length === 0 || /[\s<>(),;:\[\]\\"]/.test(email)) return "Saisis une adresse e-mail valide.";
    const parts = email.split("@");
    if (parts.length !== 2) return "Saisis une adresse e-mail valide.";
    const [local, domain] = parts;
    if (!local || local.length > 64 || local.startsWith(".") || local.endsWith(".") || local.includes("..")) return "La partie avant @ est invalide.";
    if (!/^[A-Za-z0-9.!#$%&'*+\/=?^\x60{|}~-]+$/.test(local)) return "La partie avant @ contient un caractère interdit.";
    const labels = domain.split(".");
    if (!domain.includes(".") || labels.some(label => !label || label.length > 63 || !/^[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?$/.test(label)) || !/^[A-Za-z]{2,63}$/.test(labels[labels.length - 1] || "")) {
        return "Vérifie le nom de domaine de ton adresse e-mail.";
    }
    return "";
}

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
        const usernameError = validateUsername(username);
        if (usernameError) {
            setError(usernameError);
            return;
        }
        const emailError = validateEmail(email);
        if (emailError) {
            setError(emailError);
            return;
        }
        if (password.length < 8 || !/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/\d/.test(password)) {
            setError("Le mot de passe doit contenir au moins 8 caractères, une majuscule, une minuscule et un chiffre.");
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
                        minLength={3}
                        maxLength={20}
                        pattern="[A-Za-z0-9_-]{3,20}"
                        title="3 à 20 caractères : lettres sans accent, chiffres, _ et -."
                        required
                    />
                    <small className="auth-legal">3 à 20 caractères. Lettres sans accent, chiffres, _ et -. Pas d’espaces ni de termes interdits.</small>

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
                        maxLength={254}
                        autoCapitalize="none"
                        spellCheck={false}
                        required
                    />
                    <small className="auth-legal">Utilise une adresse au format nom@domaine.fr, sans espaces.</small>

                    <label className="auth-label" htmlFor="signup-password">Mot de passe</label>
                    <input
                        id="signup-password"
                        className="auth-input"
                        type={showPassword ? "text" : "password"}
                        name="new-password"
                        autoComplete="new-password"
                        placeholder="8 caractères, majuscule, minuscule et chiffre"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        minLength={8}
                        required
                    />

                    <label className="auth-label" htmlFor="signup-confirm-password">Confirmer le mot de passe</label>
                    <input
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
