// React core
import { StrictMode } from "react";

// React DOM renderer (React 18+)
import { createRoot } from "react-dom/client";

// Global styles
import "./index.css";

// Main application component
import App from "./App.jsx";


// Root element where React will mount
const rootElement = document.getElementById("root");

// Safety check (avoid crash if DOM root missing)
if (!rootElement) {
  throw new Error("Root element #root not found in index.html");
}

// Create React root
const root = createRoot(rootElement);

// Render application
root.render(git
  <StrictMode>
    <App />
  </StrictMode>
);