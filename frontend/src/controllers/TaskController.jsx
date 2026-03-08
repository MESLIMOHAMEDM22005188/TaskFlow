import { useCallback, useEffect, useMemo, useState } from "react";
import TaskModel from "../models/TaskModel";
import { TaskView } from "../views/TaskView";
import ThemeModel from "../api/themes/ThemeModel";
import ProfileView from "../views/ProfileView";

/**
 * TaskController
 * 
 * Composant contrôleur principal de l'application TaskFlow.
 * Il gère :
 * - la récupération des tâches et thèmes depuis l'API
 * - la gestion des états React
 * - la logique métier entre les modèles et les vues
 * - le filtrage et la mise à jour des tâches
 * 
 * @param {string} token - Token JWT utilisé pour authentifier les appels API
 * @param {Function} logout - Fonction permettant de déconnecter l'utilisateur
 */
export default function TaskController({ token, logout }) {

  /**
   * Instanciation du modèle des tâches.
   * useMemo évite de recréer l'objet à chaque rendu.
   */
  const model = useMemo(() => new TaskModel(), []);

  /**
   * Instanciation du modèle des thèmes.
   * Dépend du token car l'API nécessite une authentification.
   */
  const themeModel = useMemo(() => new ThemeModel(token), [token]);

  /**
   * Etats principaux de l'application
   */
  const [tasks, setTasks] = useState([]);
  const [themes, setThemes] = useState([]);
  const [priority, setPriority] = useState("medium");
  const [filter, setFilter] = useState("all");
  const [currentTheme, setCurrentTheme] = useState(null);
  const [showProfile, setShowProfile] = useState(false);

  /**
   * Charge toutes les tâches depuis l'API.
   * Utilise useCallback pour éviter les recréations inutiles.
   */
  const loadTasks = useCallback(async () => {
    try {

      console.log("🚀 LOAD TASKS START");

      const data = await model.getTasks();

      console.log("✅ LOAD TASKS SUCCESS:", data);

      setTasks(data);

    } catch (err) {

      console.error("❌ LOAD TASKS ERROR");

      if (err.response) {
        console.error("STATUS:", err.response.status);
        console.error("DATA:", err.response.data);
        console.error("HEADERS:", err.response.headers);
        console.error("REQUEST URL:", err.config?.url);
        console.error("REQUEST METHOD:", err.config?.method);
      }

      if (err.request) {
        console.error("NO RESPONSE RECEIVED:", err.request);
      }

      console.error("FULL ERROR:", err);
    }

  }, [model]);

  /**
   * Charge les thèmes disponibles depuis l'API.
   * Définit également le premier thème comme thème actif par défaut.
   */
  const loadThemes = useCallback(async () => {
    try {

      const loadedThemes = await themeModel.getThemes();

      setThemes(loadedThemes);

      if (loadedThemes.length > 0) {
        setCurrentTheme(loadedThemes[0]);
      }

    } catch (err) {
      console.error("LOAD THEMES ERROR:", err);
    }

  }, [themeModel]);

  /**
   * Chargement initial des données lorsque le token est présent.
   */
  useEffect(() => {

    if (!token) return;

    const timer = setTimeout(() => {
      loadTasks();
      loadThemes();
    }, 0);

    return () => clearTimeout(timer);

  }, [token, loadTasks, loadThemes]);

  /**
   * Création d'un nouveau thème.
   * 
   * @param {string} themeName - Nom du thème
   * @param {string} themeColor - Couleur hexadécimale du thème
   */
  const createTheme = async (themeName, themeColor) => {

    try {

      const payload = {
        name: themeName,
        color: themeColor
      };

      console.log("🚀 CREATE THEME REQUEST:", payload);

      const newTheme = await themeModel.createTheme(payload);

      console.log("✅ CREATE THEME SUCCESS:", newTheme);

      setThemes((prev) => [...prev, newTheme]);

    } catch (err) {

      console.error("❌ CREATE THEME ERROR");

      if (err.response) {
        console.error("STATUS:", err.response.status);
        console.error("DATA:", err.response.data);
        console.error("HEADERS:", err.response.headers);
      }

      console.error("FULL ERROR:", err);
    }
  };

  /**
   * Création d'une nouvelle tâche.
   * 
   * @param {Object} taskData - Données de la tâche
   */
  const addTask = async (taskData) => {

    try {

      const res = await model.createTask(taskData);
      const createdTask = res.task;

      setTasks((prev) => [...prev, createdTask]);

    } catch (err) {
      console.error("CREATE TASK ERROR:", err);
    }
  };

  /**
   * Suppression d'un thème.
   * Recharge également les tâches pour éviter les incohérences.
   * 
   * @param {number} themeId - Identifiant du thème
   */
  const deleteTheme = async (themeId) => {

    try {

      await themeModel.deleteTheme(themeId);

      setThemes((prev) =>
        prev.filter((t) => t.id !== themeId)
      );

      await loadTasks();

    } catch (err) {
      console.error("DELETE THEME ERROR:", err);
    }
  };

  /**
   * Suppression d'une tâche.
   * 
   * @param {number} id - Identifiant de la tâche
   */
  const deleteTask = async (id) => {

    try {

      await model.deleteTask(id);

      setTasks((prev) =>
        prev.filter((t) => t.id !== id)
      );

    } catch (err) {
      console.error("DELETE ERROR:", err);
    }
  };

  /**
   * Inverse le statut complété d'une tâche.
   * 
   * @param {Object} task - Tâche à mettre à jour
   */
  const toggleStatus = async (task) => {

    try {

      console.log("⚡ TOGGLE START");
      console.log("TASK BEFORE:", task);

      const updatedCompleted = !task.completed;

      console.log("NEW COMPLETED VALUE:", updatedCompleted);

      const res = await model.updateTask(task.id, {
        completed: updatedCompleted
      });

      console.log("📡 PATCH RESPONSE:", res);

      setTasks((prev) => {

        const updated = prev.map((t) =>
          t.id === task.id
            ? { ...t, completed: updatedCompleted }
            : t
        );

        console.log("STATE AFTER UPDATE:", updated);

        return updated;
      });

    } catch (err) {

      console.error("❌ TOGGLE ERROR");

      if (err.response) {
        console.error("STATUS:", err.response.status);
        console.error("DATA:", err.response.data);
      }

      console.error(err);
    }
  };

  /**
   * Filtrage dynamique des tâches selon le filtre sélectionné.
   * 
   * - all : toutes les tâches
   * - done : tâches complétées
   * - todo : tâches à faire
   * - sinon : filtrage par thème
   */
  const filteredTasks = tasks.filter((task) => {

    if (filter === "all") {
      return true;
    }

    if (filter === "done") {
      return task.completed === true;
    }

    if (filter === "todo") {
      return task.completed === false;
    }

    return task.theme.id === filter;
  });

  /**
   * Affichage de la page profil si activée.
   */
  if (showProfile) {
    return (
      <ProfileView
        goBack={() => setShowProfile(false)}
        logout={logout}
      />
    );
  }

  /**
   * Rendu de la vue principale TaskView.
   */
  return (
    <TaskView
      tasks={filteredTasks}
      addTask={addTask}
      deleteTask={deleteTask}
      toggleStatus={toggleStatus}
      logout={logout}
      deleteTheme={deleteTheme}
      priority={priority}
      setPriority={setPriority}
      filter={filter}
      setFilter={setFilter}
      totalTasks={tasks.length}
      completedTasks={tasks.filter((t) => t.completed).length}
      themes={themes}
      createTheme={createTheme}
      currentTheme={currentTheme}
      setCurrentTheme={setCurrentTheme}
      onProfile={() => setShowProfile(true)}
    />
  );
}