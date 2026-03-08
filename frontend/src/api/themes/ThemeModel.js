import api from "../../api/axios";

export default class ThemeModel {

  async getThemes() {
    const res = await api.get("/themes");
    return res.data.themes;
  }

  async createTheme(data) {
    const res = await api.post("/themes", data);
    return res.data.theme;
  }

  async deleteTheme(id) {
    await api.delete(`/themes/${id}`);
  }
}
