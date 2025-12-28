import { defineStore } from 'pinia'
import { ref } from 'vue'
import { projectApi } from '@/api/projects'
import type { Project } from '@/types/projects'
import type { CreateProjectPayload, UpdateProjectPayload, AddMemberPayload } from '@/types/projects'
import { showSuccess, showError } from '@/utils/toast'

export const useProjectsStore = defineStore('projects', () => {
  const projects = ref<Project[]>([])
  const currentProject = ref<Project | null>(null)
  const loading = ref(false)

  async function fetchProjects(query?: { q?: string; sortDirection?: string; sortBy?: string; page?: number; perPage?: number }) {
    loading.value = true
    try {
      const response = await projectApi.list(query)
      if (response.success && response.data) {
        projects.value = Array.isArray(response.data.data) ? response.data.data : []
      }
    } catch (error: any) {
      showError(error.response?.data?.error_message || 'Failed to fetch projects')
      throw error
    } finally {
      loading.value = false
    }
  }

  async function fetchProject(id: number) {
    loading.value = true
    try {
      const response = await projectApi.get(id)
      if (response.success && response.data) {
        currentProject.value = response.data
        return response.data
      }
      return null
    } catch (error: any) {
      showError(error.response?.data?.error_message || 'Failed to fetch project')
      throw error
    } finally {
      loading.value = false
    }
  }

  async function createProject(payload: CreateProjectPayload) {
    try {
      const response = await projectApi.create(payload)
      if (response.success) {
        showSuccess('Project created successfully')
        await fetchProjects()
        return { success: true, data: response.data }
      }
      return { success: false, message: response.message }
    } catch (error: any) {
      const message = error.response?.data?.error_message || 'Failed to create project'
      showError(message)
      return { success: false, message }
    }
  }

  async function updateProject(id: number, payload: UpdateProjectPayload) {
    try {
      const response = await projectApi.update(id, payload)
      if (response.success) {
        showSuccess('Project updated successfully')
        await fetchProjects()
        if (currentProject.value?.id === id) {
          await fetchProject(id)
        }
        return { success: true, data: response.data }
      }
      return { success: false, message: response.message }
    } catch (error: any) {
      const message = error.response?.data?.error_message || 'Failed to update project'
      showError(message)
      return { success: false, message }
    }
  }

  async function deleteProject(id: number) {
    try {
      const response = await projectApi.delete(id)
      if (response.success) {
        showSuccess('Project deleted successfully')
        await fetchProjects()
        if (currentProject.value?.id === id) {
          currentProject.value = null
        }
        return { success: true }
      }
      return { success: false, message: response.message }
    } catch (error: any) {
      const message = error.response?.data?.error_message || 'Failed to delete project'
      showError(message)
      return { success: false, message }
    }
  }

  async function addMember(projectId: number, payload: AddMemberPayload) {
    try {
      const response = await projectApi.addMember(projectId, payload)
      if (response.success) {
        showSuccess('Member added successfully')
        await fetchProject(projectId)
        return { success: true }
      }
      return { success: false, message: response.message }
    } catch (error: any) {
      const message = error.response?.data?.error_message || 'Failed to add member'
      showError(message)
      return { success: false, message }
    }
  }

  async function removeMember(projectId: number, userId: number) {
    try {
      const response = await projectApi.removeMember(projectId, userId)
      if (response.success) {
        showSuccess('Member removed successfully')
        await fetchProject(projectId)
        return { success: true }
      }
      return { success: false, message: response.message }
    } catch (error: any) {
      const message = error.response?.data?.error_message || 'Failed to remove member'
      showError(message)
      return { success: false, message }
    }
  }

  return {
    projects,
    currentProject,
    loading,
    fetchProjects,
    fetchProject,
    createProject,
    updateProject,
    deleteProject,
    addMember,
    removeMember,
  }
})

