import api from "../api/axios";

export default class TaskModel {

  constructor() {
    this.api = api;
  }

  async getTasks() {
  try {

    console.log("📡 API CALL → GET /tasks");

    const res = await this.api.get("/tasks");

    console.log("📦 API RESPONSE:", res.data);

    return res.data;

  } catch (err) {

    console.error("🔥 API GET TASKS FAILED");

    if (err.response) {
      console.error("STATUS:", err.response.status);
      console.error("DATA:", err.response.data);
    }

    throw err;
  }
}

  async createTask(data) {
  try {

    console.log("📡 API CALL → POST /tasks", data);

    const res = await this.api.post("/tasks", data);

    console.log("📦 API RESPONSE CREATE:", res.data);

    return res.data;

  } catch (err) {

    console.error("🔥 CREATE TASK FAILED");

    if (err.response) {
      console.error("STATUS:", err.response.status);
      console.error("DATA:", err.response.data);
    }

    throw err;
  }
}

  async deleteTask(id) {
    await this.api.delete(`/tasks/${id}`);
  }

  async updateTask(id, data) {

  console.log("📡 API CALL → PATCH /tasks", id, data);

  const res = await this.api.patch(`/tasks/${id}`, data);

  console.log("📦 API RESPONSE UPDATE:", res.data);

  return res.data;
}
}
