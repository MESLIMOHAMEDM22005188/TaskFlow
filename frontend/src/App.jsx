// React hook for state management
import { useState } from "react";

// Controllers 
import TaskController from "./controllers/TaskController";
// Auth views
import LoginView from "./views/LoginView";
import Register from "./views/Register";
import AuthHome from "./views/AuthHome";

function App() {
    // JWT token stored in localStorage
  const [token, setToken] = useState(localStorage.getItem("token"));

  // Authentication screen state
  // possible values: "home" | "login" | "register"
  const [authMode, setAuthMode] = useState("home"); 
    
  // Called when login or register succeeds
  const handleAuthSuccess = (newToken) => {
    localStorage.setItem("token", newToken);
    setToken(newToken);
  };

  // Logout user
  const logout = () => {
    localStorage.removeItem("token");
    setToken(null);
    setAuthMode("home");
  };

  
  // If user is NOT authenticated
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

  // If user is authenticated → load main app
  return (
  <TaskController 
  token={token} 
  logout={logout} 
  />
  );
}

export default App;
