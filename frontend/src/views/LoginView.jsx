import { useState, useEffect } from "react";
import api from "../api/axios";
import "../assets/css/login.css";

export default function LoginView({ onSuccess, goRegister, goHome }) {
  const [email, setEmail] = useState("");   // ✅ on passe à email
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);

  useEffect(() => {
    console.log("LOGIN VIEW RENDERED");
  }, []);

  const handleLogin = async () => {
    try {
      setError(null);

      const res = await api.post("/auth/login", {
        email,          // ✅ envoi email
        password
      });

      onSuccess(res.data.token);

    } catch (err) {
      setError(
        err.response?.data?.message || "Login failed"
      );
    }
  };

  return (
    <div className="container">
      <div className="top"></div>
      <div className="bottom"></div>

      <div className="center">
        <h2>Login</h2>

        {error && <p className="error">{error}</p>}

        {/* ✅ CHAMP EMAIL */}
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

        <button onClick={handleLogin}>Login</button>

        <div style={{ marginTop: "20px" }}>
          <p onClick={goRegister} style={{ cursor: "pointer" }}>
            Create account
          </p>
          <p onClick={goHome} style={{ cursor: "pointer" }}>
            Back
          </p>
        </div>
      </div>
    </div>
  );
}