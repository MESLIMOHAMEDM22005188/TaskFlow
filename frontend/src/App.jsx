import { useState } from "react";
import TaskController from "./controllers/TaskController";
import LoginView from "./views/LoginView";
import Register from "./views/Register";
import AuthHome from "./views/AuthHome";

function App() {
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [authMode, setAuthMode] = useState("home"); 
  // "home" | "login" | "register"

  const handleAuthSuccess = (newToken) => {
    localStorage.setItem("token", newToken);
    setToken(newToken);
  };

  const logout = () => {
    localStorage.removeItem("token");
    setToken(null);
    setAuthMode("home");
  };

  if (!token) {
    if (authMode === "home") {
      return <AuthHome setAuthMode={setAuthMode} />;
    }

    if (authMode === "login") {
      return (
        <LoginView
          onSuccess={handleAuthSuccess}
          goRegister={() => setAuthMode("register")}
          goHome={() => setAuthMode("home")}
        />
      );
    }

    if (authMode === "register") {
      return (
        <Register
          onSuccess={handleAuthSuccess}
          goLogin={() => setAuthMode("login")}
          goHome={() => setAuthMode("home")}
        />
      );
    }
  }

  return <TaskController token={token} logout={logout} />;
}

export default App;
