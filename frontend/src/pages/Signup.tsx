import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

export default function Signup() {

    const navigate = useNavigate();

    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const handleSubmit = async (e: any) => {

        e.preventDefault();

        try {

            await api.post("/auth/signup", {
                username,
                email,
                password
            });

            navigate("/login");

        } catch (err) {

            console.error(err);
            alert("Signup failed");

        }

    };

    return (

        <div style={{padding:40}}>

            <h1>Signup</h1>

            <form onSubmit={handleSubmit}>

                <input
                    placeholder="username"
                    value={username}
                    onChange={(e)=>setUsername(e.target.value)}
                />

                <br/>

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
                    Create account
                </button>

            </form>

        </div>

    );

}