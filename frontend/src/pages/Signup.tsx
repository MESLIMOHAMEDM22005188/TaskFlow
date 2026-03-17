import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import "../assets/css/auth.css";

export default function Signup() {

    const navigate = useNavigate();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [username, setUsername] = useState("");

    const handleSignup = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        try {
            await api.post("/auth/signup", {
                email,
                password,
                username
            });

            alert("Account created");
            navigate("/login");

        } catch (err) {
            console.error(err);
            alert("Signup failed");
        }
    };

    return (
        <div className="auth-container">

            <form className="auth-card" onSubmit={handleSignup}>

                <h2 className="auth-title">Create account</h2>

                <input
                    className="auth-input"
                    type="text"
                    placeholder="Username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                />

                <input
                    className="auth-input"
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                />

                <input
                    className="auth-input"
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                />

                <button className="auth-button" type="submit">
                    Sign up
                </button>

                <p className="auth-text">
                    Already have an account?
                </p>

                <button
                    type="button"
                    className="auth-secondary"
                    onClick={() => navigate("/login")}
                >
                    Login
                </button>

            </form>

        </div>
    );
}