import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import "../assets/css/auth.css";

export default function Login() {

    const navigate = useNavigate();

    const [email,setEmail] = useState("");
    const [password,setPassword] = useState("");

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        try {

            const res = await api.post("/auth/login",{
                email,
                password
            });

            localStorage.setItem("token",res.data.token);

            navigate("/dashboard");

        } catch(error){
            console.error(error);
            alert("Login failed");
        }
    };

    return(

        <div className="auth-container">

            <form className="auth-card" onSubmit={handleSubmit}>

                <h2 className="auth-title">Login</h2>

                <input
                    className="auth-input"
                    placeholder="Email"
                    value={email}
                    onChange={(e)=>setEmail(e.target.value)}
                />

                <input
                    className="auth-input"
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e)=>setPassword(e.target.value)}
                />

                <button className="auth-button" type="submit">
                    Login
                </button>

                <p>
                    No account?
                </p>

                <button
                    type="button"
                    className="auth-secondary"
                    onClick={() => navigate("/signup")}
                >
                    Sign up
                </button>

            </form>

        </div>

    );
}