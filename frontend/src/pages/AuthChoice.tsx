import { useNavigate } from "react-router-dom";

export default function AuthChoice() {

    const navigate = useNavigate();

    return (
        <div style={container}>

            <h1 style={title}>TaskFlow</h1>

            <p style={subtitle}>
                Organise tes tâches simplement
            </p>

            <div style={buttons}>

                <button
                    style={login}
                    onClick={() => navigate("/login")}
                >
                    Login
                </button>

                <button
                    style={signup}
                    onClick={() => navigate("/signup")}
                >
                    Sign up
                </button>

            </div>

        </div>
    );
}

const container = {
    height: "100vh",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    background: "#0f172a",
    color: "white"
};

const title = {
    fontSize: "48px",
    marginBottom: "10px"
};

const subtitle = {
    marginBottom: "40px",
    opacity: 0.8
};

const buttons = {
    display: "flex",
    gap: "20px"
};

const login = {
    padding: "12px 30px",
    borderRadius: "8px",
    border: "none",
    background: "#2563eb",
    color: "white",
    fontSize: "16px",
    cursor: "pointer"
};

const signup = {
    padding: "12px 30px",
    borderRadius: "8px",
    border: "none",
    background: "#16a34a",
    color: "white",
    fontSize: "16px",
    cursor: "pointer"
};
