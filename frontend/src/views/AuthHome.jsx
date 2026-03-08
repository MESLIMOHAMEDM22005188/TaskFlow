import "../assets/css/auth.css";

export default function AuthHome({ setAuthMode }) {
  return (
    <div className="auth-root">

      <div className="auth-background">
        <div className="auth-background-blur" />
        <div className="auth-background-glow" />
      </div>

      <div className="auth-wrapper">

        <div className="auth-card">

          <div className="auth-header">
            <h1 className="auth-title">Welcome to TaskFlow</h1>
            <p className="auth-subtitle">
              Organize. Track. Evolve.
            </p>
          </div>

          <div className="auth-actions">

            <button
              className="auth-btn auth-btn-primary"
              onClick={() => setAuthMode("login")}
            >
              <span className="auth-btn-text">Login</span>
            </button>

            <button
              className="auth-btn auth-btn-secondary"
              onClick={() => setAuthMode("register")}
            >
              <span className="auth-btn-text">Create Account</span>
            </button>

          </div>

          <div className="auth-footer">
            <span className="auth-footer-text">
              Secure • Modern • Private
            </span>
          </div>

        </div>

      </div>
    </div>
  );
}
