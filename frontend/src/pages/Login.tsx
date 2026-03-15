import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

export default function Login() {

    const navigate = useNavigate();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const handleSubmit = async (e:any) => {

        e.preventDefault();

        try {

            const res = await api.post("/auth/login", {
                email,
                password
            });

            localStorage.setItem("token", res.data.token);

            navigate("/dashboard");

        } catch (err) {

            alert("Login failed");

        }

    };

    return (

        <div style={{padding:40}}>

            <h1>Login</h1>

            <form onSubmit={handleSubmit}>

                <input
                    placeholder="email"
                    value={email}
                    onChange={(e)=>setEmail(e.target.value)}
                />

                <br/>

                <input
                    type="password"
                    placeholder="password"
                    value={password}
                    onChange={(e)=>setPassword(e.target.value)}
                />

                <br/>

                <button type="submit">
                    Login
                </button>

            </form>

        </div>

    );

}