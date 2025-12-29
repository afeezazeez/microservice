import { defineStore } from 'pinia'
import { ref } from 'vue'
import { taskApi } from '@/api/tasks'
import type { Task } from '@/types/tasks'
import type { CreateTaskPayload, UpdateTaskPayload } from '@/types/tasks'
import { showSuccess, showError } from '@/utils/toast'

export const useTasksStore = defineStore('tasks', () => {
  const tasks = ref<Task[]>([])
  const currentTask = ref<Task | null>(null)
  const loading = ref(false)

  async function fetchTasks(query?: { project_id?: number; q?: string; sortDirection?: string; sortBy?: string; page?: number; perPage?: number }) {
    loading.value = true
    try {
      const response = await taskApi.list(query)
      if (response.success && response.data) {
        tasks.value = Array.isArray(response.data.data) ? response.data.data : []
      }
    } catch (error: any) {
      showError(error.response?.data?.error_message || 'Failed to fetch tasks')
      throw error
    } finally {
      loading.value = false
    }
  }

  async function fetchTask(id: number) {
    loading.value = true
    try {
      const response = await taskApi.get(id)
      if (response.success && response.data) {
        currentTask.value = response.data
        return response.data
      }
      return null
    } catch (error: any) {
      showError(error.response?.data?.error_message || 'Failed to fetch task')
      throw error
    } finally {
      loading.value = false
    }
  }

  async function createTask(payload: CreateTaskPayload) {
    try {
      const response = await taskApi.create(payload)
      if (response.success) {
        showSuccess('Task created successfully')
        await fetchTasks({ project_id: payload.project_id })
        return { success: true, data: response.data }
      }
      return { success: false, message: response.message }
    } catch (error: any) {
      const message = error.response?.data?.error_message || 'Failed to create task'
      showError(message)
      return { success: false, message }
    }
  }

  async function updateTask(id: number, payload: UpdateTaskPayload) {
    try {
      const response = await taskApi.update(id, payload)
      if (response.success) {
        showSuccess('Task updated successfully')
        const task = tasks.value.find(t => t.id === id)
        if (task) {
          await fetchTasks({ project_id: task.project_id })
        }
        if (currentTask.value?.id === id) {
          await fetchTask(id)
        }
        return { success: true, data: response.data }
      }
      return { success: false, message: response.message }
    } catch (error: any) {
      const message = error.response?.data?.error_message || 'Failed to update task'
      showError(message)
      return { success: false, message }
    }
  }

  async function deleteTask(id: number) {
    try {
      const projectId = tasks.value.find(t => t.id === id)?.project_id
      const response = await taskApi.delete(id)
      if (response.success) {
        showSuccess('Task deleted successfully')
        if (projectId) {
          await fetchTasks({ project_id: projectId })
        }
        if (currentTask.value?.id === id) {
          currentTask.value = null
        }
        return { success: true }
      }
      return { success: false, message: response.message }
    } catch (error: any) {
      const message = error.response?.data?.error_message || 'Failed to delete task'
      showError(message)
      return { success: false, message }
    }
  }

  async function startWatching(taskId: number) {
    try {
      const response = await taskApi.startWatching(taskId)
      if (response.success) {
        showSuccess('Started watching task')
        await fetchTask(taskId)
        const task = tasks.value.find(t => t.id === taskId)
        if (task) {
          await fetchTasks({ project_id: task.project_id })
        }
        return { success: true }
      }
      return { success: false, message: response.message }
    } catch (error: any) {
      const message = error.response?.data?.error_message || 'Failed to start watching task'
      showError(message)
      return { success: false, message }
    }
  }

  async function stopWatching(taskId: number) {
    try {
      const response = await taskApi.stopWatching(taskId)
      if (response.success) {
        showSuccess('Stopped watching task')
        await fetchTask(taskId)
        const task = tasks.value.find(t => t.id === taskId)
        if (task) {
          await fetchTasks({ project_id: task.project_id })
        }
        return { success: true }
      }
      return { success: false, message: response.message }
    } catch (error: any) {
      const message = error.response?.data?.error_message || 'Failed to stop watching task'
      showError(message)
      return { success: false, message }
    }
  }

  return {
    tasks,
    currentTask,
    loading,
    fetchTasks,
    fetchTask,
    createTask,
    updateTask,
    deleteTask,
    startWatching,
    stopWatching,
  }
})


