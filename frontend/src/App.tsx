import { Routes, Route } from "react-router-dom";

import AuthChoice from "./pages/AuthChoice";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard";
import Objectifs from "./pages/Objectifs";
import Flow from "./pages/Flow";
import Profil from "./pages/Profil";
import Communaute from "./pages/Communaute";
import Parametres from "./pages/Parametres";

function App() {

    return (

        <Routes>

            <Route path="/" element={<AuthChoice />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />

            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/objectifs" element={<Objectifs />} />
            <Route path="/flow" element={<Flow />} />
            <Route path="/profil" element={<Profil />} />
            <Route path="/communaute" element={<Communaute />} />
            <Route path="/parametres" element={<Parametres />} />

        </Routes>

    );
}

export default App;