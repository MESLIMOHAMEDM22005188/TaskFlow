import api from "../api/axios";

/**
 * TaskModel
 *
 * Data access layer for task-related API calls.
 * Responsible for communicating with the backend
 * through the Axios instance.
 */
export default class TaskModel {

  constructor() {
    this.api = api;
  }

  /**
   * Fetch all tasks for the authenticated user
   *
   * @returns {Promise<Array>} list of tasks
   */
  async getTasks() {

    try {

      const res = await this.api.get("/tasks");

      return res.data;

    } catch (err) {

      throw new Error(
        err.response?.data?.message ||
        "Failed to fetch tasks"
      );

    }

  }


  /**
   * Create a new task
   *
   * @param {Object} data
   * @param {string} data.title task title
   * @param {string} data.priority task priority
   * @param {number|null} data.themeId associated theme id
   *
   * @returns {Promise<Object>} created task
   */
  async createTask(data) {

    try {

      const res = await this.api.post("/tasks", data);

      return res.data;

    } catch (err) {

      throw new Error(
        err.response?.data?.message ||
        "Failed to create task"
      );

    }

  }


  /**
   * Delete a task by id
   *
   * @param {number} id task id
   *
   * @returns {Promise<void>}
   */
  async deleteTask(id) {

    try {

      await this.api.delete(`/tasks/${id}`);

    } catch (err) {

      throw new Error(
        err.response?.data?.message ||
        "Failed to delete task"
      );

    }

  }


  /**
   * Update an existing task
   *
   * @param {number} id task id
   * @param {Object} data updated fields
   *
   * @returns {Promise<Object>} updated task
   */
  async updateTask(id, data) {

    try {

      const res = await this.api.patch(`/tasks/${id}`, data);

      return res.data;

    } catch (err) {

      throw new Error(
        err.response?.data?.message ||
        "Failed to update task"
      );

    }

  }

}