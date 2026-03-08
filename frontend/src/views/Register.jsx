import { useState } from "react";
import "../assets/css/register.css";

/**
 * Register View
 *
 * Handles user registration and authentication token storage.
 *
 * @param {Object} props
 * @param {Function} props.onSuccess Called when registration succeeds (receives JWT token)
 * @param {Function} props.goLogin Navigate to login screen
 * @param {Function} props.goHome Navigate back to auth home screen
 *
 * @returns {JSX.Element}
 */
function Register({ onSuccess, goLogin, goHome }) {

  /* ================= STATE ================= */

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);


  /* ================= REGISTER HANDLER ================= */

  const handleRegister = async () => {

    if (!username.trim() || !email.trim() || !password.trim()) {
      setError("All fields are required");
      return;
    }

    setError(null);
    setLoading(true);

    try {

      const res = await fetch("http://localhost:3000/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          username,
          email,
          password
        })
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "Registration failed");
        return;
      }

      // Save JWT token
      localStorage.setItem("token", data.token);

      // Notify parent component
      onSuccess(data.token);

    } catch (err) {

      setError("Network error while registering");

    } finally {

      setLoading(false);

    }

  };


  /* ================= RENDER ================= */

  return (

    <div className="login-container">

      <div className="form">

        <h1>Create Account</h1>

        {error && (
          <p className="error">{error}</p>
        )}

        <input
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button
          onClick={handleRegister}
          disabled={loading}
        >
          {loading ? "Creating account..." : "Register"}
        </button>

        <p
          onClick={goLogin}
          style={{ cursor: "pointer" }}
        >
          Already have an account
        </p>

        <p
          onClick={goHome}
          style={{ cursor: "pointer" }}
        >
          Back
        </p>

      </div>

    </div>

  );

}

export default Register;