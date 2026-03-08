import api from "../../api/axios";

/**
 * ThemeModel
 *
 * Modèle chargé de gérer les opérations API
 * liées aux thèmes (CRUD partiel).
 *
 * Ce modèle agit comme une couche d'accès
 * aux données entre le controller React
 * et l'API backend.
 */
export default class ThemeModel {

  /**
   * Récupère tous les thèmes depuis l'API.
   *
   * Endpoint :
   * GET /themes
   *
   * @returns {Promise<Array>} Liste des thèmes
   */
  async getThemes() {
    const res = await api.get("/themes");
    return res.data.themes;
  }

  /**
   * Crée un nouveau thème.
   *
   * Endpoint :
   * POST /themes
   *
   * @param {Object} data - Données du thème
   * @param {string} data.name - Nom du thème
   * @param {string} data.color - Couleur du thème (hex)
   *
   * @returns {Promise<Object>} Thème créé
   */
  async createTheme(data) {
    const res = await api.post("/themes", data);
    return res.data.theme;
  }

  /**
   * Supprime un thème existant.
   *
   * Endpoint :
   * DELETE /themes/:id
   *
   * @param {number|string} id - Identifiant du thème
   */
  async deleteTheme(id) {
    await api.delete(`/themes/${id}`);
  }
}