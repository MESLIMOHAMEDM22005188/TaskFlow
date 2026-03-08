import { useState } from "react";
import "../assets/css/register.css";

function Register({ onSuccess, goLogin, goHome }) {

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);

  const handleRegister = async () => {

    console.log("🚀 REGISTER CLICKED");

    if (!username || !email || !password) {
      console.warn("⚠️ Missing fields", { username, email, password });
      setError("All fields are required");
      return;
    }

    try {

      console.log("📤 Sending register request:", {
        username,
        email,
        password
      });

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

      console.log("📡 RESPONSE STATUS:", res.status);

      const data = await res.json();

      console.log("📦 RESPONSE DATA:", data);

      if (!res.ok) {
        console.error("❌ REGISTER FAILED:", data);
        setError(data.message || "Registration failed");
        return;
      }

      console.log("✅ REGISTER SUCCESS");

      localStorage.setItem("token", data.token);

      onSuccess(data.token);

    } catch (err) {

      console.error("🔥 FRONT REGISTER ERROR:", err);

      setError("Network error while registering");
    }
  };

  return (
    <div className="login-container">
      <div className="form">

        <h1>Create Account</h1>

        {error && <p className="error">{error}</p>}

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

        <button onClick={handleRegister}>Register</button>

        <p onClick={goLogin} style={{ cursor: "pointer" }}>
          Already have account
        </p>

        <p onClick={goHome} style={{ cursor: "pointer" }}>
          Back
        </p>

      </div>
    </div>
  );
}

export default Register;