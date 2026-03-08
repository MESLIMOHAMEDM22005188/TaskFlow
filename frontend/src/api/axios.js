import axios from "axios";

/**
 * Instance Axios centrale utilisée pour tous les appels API.
 * 
 * Configuration :
 * - baseURL : URL de base du backend
 * - interceptors : gestion automatique du token et des erreurs
 */
const api = axios.create({
  baseURL: "http://localhost:3000/api"
});

/**
 * Intercepteur de requête.
 * 
 * Objectif :
 * Ajouter automatiquement le token JWT dans les headers
 * de chaque requête envoyée vers l'API.
 */
api.interceptors.request.use((config) => {

  /**
   * Récupération du token stocké dans le localStorage
   */
  const token = localStorage.getItem("token");

  /**
   * Si un token existe, on ajoute l'en-tête Authorization
   * au format standard Bearer Token.
   */
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

/**
 * Intercepteur de réponse.
 * 
 * Permet de gérer globalement les erreurs HTTP
 * avant qu'elles arrivent dans les composants.
 */
api.interceptors.response.use(

  /**
   * Si la réponse est valide, on la retourne simplement.
   * 
   * @param {Object} response - Réponse HTTP d'Axios
   * @returns {Object} response
   */
  (response) => response,

  /**
   * Gestion centralisée des erreurs HTTP.
   * 
   * @param {Object} error - Erreur Axios retournée par l'API
   */
  (error) => {

    /**
     * Si l'API retourne un statut 401 (Unauthorized),
     * cela signifie que le token est invalide ou expiré.
     */
    if (error.response?.status === 401) {

      /**
       * Suppression du token local.
       */
      localStorage.removeItem("token");

      /**
       * Redirection vers la page de connexion.
       */
      window.location.href = "/";
    }

    /**
     * Propagation de l'erreur pour traitement éventuel
     * dans les appels API du frontend.
     */
    return Promise.reject(error);
  }
);

export default api;