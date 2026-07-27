import "../assets/css/dashboard.css";

export function Dashboard() {
    return (
        <div
            style={{
                minHeight: "100vh",
                background: "#111827",
                color: "white",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexDirection: "column",
                fontFamily: "Arial"
            }}
        >
            <h1>🚀 Dashboard OK</h1>
            <p>Si tu vois cette page et qu'elle ne disparaît pas, React fonctionne.</p>

            <button
                onClick={() => alert("Le JavaScript fonctionne")}
                style={{
                    padding: "10px 20px",
                    marginTop: "20px",
                    cursor: "pointer"
                }}
            >
                Tester
            </button>
        </div>
    );
}
