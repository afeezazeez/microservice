<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import Layout from '@/components/Layout.vue'
import Modal from '@/components/Modal.vue'
import ConfirmModal from '@/components/ConfirmModal.vue'
import { useProjectsStore } from '@/stores/projects'
import { useTasksStore } from '@/stores/tasks'
import { useUsersStore } from '@/stores/users'
import { useAuthStore } from '@/stores/auth'
import { fileApi } from '@/api/files'
import type { FileResponse } from '@/types/files'
import type { Task } from '@/types/tasks'
import type { CreateTaskPayload, UpdateTaskPayload } from '@/types/tasks'
import type { AddMemberPayload } from '@/types/projects'
import { showError, showSuccess } from '@/utils/toast'

const route = useRoute()
const router = useRouter()
const projectsStore = useProjectsStore()
const tasksStore = useTasksStore()
const usersStore = useUsersStore()
const authStore = useAuthStore()

const projectId = computed(() => parseInt(route.params.id as string))

const canCreateTask = computed(() => {
  const permissions = authStore.user?.permissions || []
  return permissions.includes('task:create')
})

const canEditTask = computed(() => {
  const permissions = authStore.user?.permissions || []
  return permissions.includes('task:edit')
})

const canDeleteTask = computed(() => {
  const permissions = authStore.user?.permissions || []
  return permissions.includes('task:delete')
})

const showCreateTaskModal = ref(false)
const showEditTaskModal = ref(false)
const showDeleteTaskModal = ref(false)
const showAddMemberModal = ref(false)
const showDeleteMemberModal = ref(false)
const showPreviewModal = ref(false)
const previewFile = ref<FileResponse | null>(null)
const selectedTask = ref<Task | null>(null)
const taskToDelete = ref<number | null>(null)
const memberToDelete = ref<number | null>(null)
const watchingTasks = ref<Set<number>>(new Set())
const expandedWatchers = ref<Set<number>>(new Set())
const expandedFiles = ref<Set<number>>(new Set())

const addMemberForm = ref({
  user_id: 0,
})

interface PendingFile {
  id: string
  file?: File
  fileId?: number
  uploadProgress: number
  isUploading: boolean
  error?: string
  original_name?: string
  size?: number
  mime_type?: string
}

interface StoredPendingFile {
  fileId: number
  original_name: string
  size: number
  mime_type: string
}

const createTaskForm = ref({
  title: '',
  description: '',
  status: 'TODO' as 'TODO' | 'IN_PROGRESS' | 'DONE' | 'BLOCKED',
  assigned_to: 0,
  due_date: '',
})

const editTaskForm = ref<{
  title: string
  description: string
  status: 'TODO' | 'IN_PROGRESS' | 'DONE' | 'BLOCKED'
  assigned_to: number
  due_date: string | undefined
}>({
  title: '',
  description: '',
  status: 'TODO',
  assigned_to: 0,
  due_date: undefined,
})

const pendingFiles = ref<Map<string, PendingFile>>(new Map())
const taskFiles = ref<Map<number, FileResponse[]>>(new Map())
const loadingFiles = ref<Map<number, boolean>>(new Map())

function getCreatePendingFilesKey(): string {
  return `pending_task_files_create_${projectId.value}`
}

function getEditPendingFilesKey(taskId: number): string {
  return `pending_task_files_edit_${taskId}`
}

function savePendingFilesToStorage(isEdit: boolean = false, taskId?: number): void {
  const fileIds = Array.from(pendingFiles.value.values())
    .filter(f => f.fileId !== undefined)
    .map(f => ({
      fileId: f.fileId!,
      original_name: f.original_name || f.file?.name || 'Unknown',
      size: f.size || f.file?.size || 0,
      mime_type: f.mime_type || f.file?.type || 'application/octet-stream',
    } as StoredPendingFile))

  const key = isEdit && taskId ? getEditPendingFilesKey(taskId) : getCreatePendingFilesKey()
  if (fileIds.length > 0) {
    localStorage.setItem(key, JSON.stringify(fileIds))
  } else {
    localStorage.removeItem(key)
  }
}

async function loadPendingFilesFromStorage(isEdit: boolean = false, taskId?: number): Promise<void> {
  const key = isEdit && taskId ? getEditPendingFilesKey(taskId) : getCreatePendingFilesKey()
  const stored = localStorage.getItem(key)
  
  if (!stored) {
    return
  }

  try {
    const storedFiles: StoredPendingFile[] = JSON.parse(stored)
    
    for (const storedFile of storedFiles) {
      const fileId = `restored-${storedFile.fileId}-${Date.now()}`
      const pendingFile: PendingFile = {
        id: fileId,
        fileId: storedFile.fileId,
        uploadProgress: 100,
        isUploading: false,
        original_name: storedFile.original_name,
        size: storedFile.size,
        mime_type: storedFile.mime_type,
      }
      pendingFiles.value.set(fileId, pendingFile)
    }
  } catch (error) {
    console.error('Failed to load pending files from storage:', error)
    localStorage.removeItem(key)
  }
}

function clearPendingFilesFromStorage(isEdit: boolean = false, taskId?: number): void {
  const key = isEdit && taskId ? getEditPendingFilesKey(taskId) : getCreatePendingFilesKey()
  localStorage.removeItem(key)
}

function openCreateTaskModal() {
  createTaskForm.value = {
    title: '',
    description: '',
    status: 'TODO',
    assigned_to: 0,
    due_date: '',
  }
  pendingFiles.value.clear()
  loadPendingFilesFromStorage(false)
  showCreateTaskModal.value = true
}

async function handleCreateTask() {
  const fileIds = Array.from(pendingFiles.value.values())
    .filter(f => f.fileId !== undefined)
    .map(f => f.fileId!)

  const payload: CreateTaskPayload = {
    project_id: projectId.value,
    title: createTaskForm.value.title,
    description: createTaskForm.value.description || undefined,
    status: createTaskForm.value.status,
    assigned_to: createTaskForm.value.assigned_to || undefined,
    due_date: createTaskForm.value.due_date || undefined,
    file_ids: fileIds.length > 0 ? fileIds : undefined,
  }

  const result = await tasksStore.createTask(payload)
  if (result.success) {
    showCreateTaskModal.value = false
    pendingFiles.value.clear()
    clearPendingFilesFromStorage(false)
  }
}

function isValidFileType(file: File): boolean {
  const validTypes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/svg+xml',
    'image/bmp',
    'image/tiff',
    'video/mp4',
    'video/mpeg',
    'video/quicktime',
    'video/x-msvideo',
    'video/x-ms-wmv',
    'video/webm',
    'video/ogg',
    'application/pdf',
  ]
  
  if (validTypes.includes(file.type)) {
    return true
  }
  
  const extension = file.name.split('.').pop()?.toLowerCase()
  const validExtensions = [
    'jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp', 'tiff',
    'mp4', 'mpeg', 'mov', 'avi', 'wmv', 'webm', 'ogv',
    'pdf'
  ]
  
  return validExtensions.includes(extension || '')
}

async function handleFileUpload(event: Event) {
  const input = event.target as HTMLInputElement
  if (!input.files || input.files.length === 0) return

  const files = Array.from(input.files)
  
  const invalidFiles = files.filter(file => !isValidFileType(file))
  if (invalidFiles.length > 0) {
    const invalidNames = invalidFiles.map(f => f.name).join(', ')
    showError(`Invalid file type(s): ${invalidNames}. Only images, videos, and PDFs are allowed.`)
    input.value = ''
    return
  }
  
  for (const file of files) {
    const fileId = `pending-${Date.now()}-${Math.random()}`
    const pendingFile: PendingFile = {
      id: fileId,
      file,
      uploadProgress: 0,
      isUploading: true,
    }
    
    pendingFiles.value.set(fileId, pendingFile)

    try {
      const response = await fileApi.upload(file, (progress) => {
        const pf = pendingFiles.value.get(fileId)
        if (pf) {
          pf.uploadProgress = progress
        }
      })

      if (response.success && response.data) {
        const pf = pendingFiles.value.get(fileId)
        if (pf) {
          pf.fileId = response.data.id
          pf.isUploading = false
          pf.uploadProgress = 100
          pf.original_name = file.name
          pf.size = file.size
          pf.mime_type = file.type
        }
        savePendingFilesToStorage(showEditTaskModal.value, selectedTask.value?.id)
      } else {
        throw new Error(response.message || 'Upload failed')
      }
    } catch (error: any) {
      const pf = pendingFiles.value.get(fileId)
      if (pf) {
        pf.isUploading = false
        pf.error = error.response?.data?.error_message || error.message || 'Upload failed'
      }
      const errorMsg = pf?.error || 'Unknown error'
      showError(`Failed to upload "${file.name}": ${errorMsg}`)
    }
  }

  input.value = ''
}

async function handleDetachFile(fileId: string) {
  const pendingFile = pendingFiles.value.get(fileId)
  if (!pendingFile) return

  if (pendingFile.fileId) {
    try {
      await fileApi.delete(pendingFile.fileId)
    } catch (error: any) {
      showError(error.response?.data?.error_message || 'Failed to remove file')
      return
    }
  }

  pendingFiles.value.delete(fileId)
  savePendingFilesToStorage(showEditTaskModal.value, selectedTask.value?.id)
}

async function handleDeleteTaskFile(taskId: number, fileId: number) {
  try {
    await fileApi.delete(fileId)
    showSuccess('File deleted successfully')
    await loadTaskFiles(taskId)
    await tasksStore.fetchTasks({ project_id: projectId.value })
  } catch (error: any) {
    showError(error.response?.data?.error_message || 'Failed to delete file')
  }
}

async function loadTaskFiles(taskId: number) {
  if (loadingFiles.value.get(taskId)) return
  
  loadingFiles.value.set(taskId, true)
  try {
    const task = await tasksStore.fetchTask(taskId)
    
    if (!task) {
      taskFiles.value.set(taskId, [])
      return
    }
    
    if (!task.file_ids || task.file_ids.length === 0) {
      taskFiles.value.set(taskId, [])
      return
    }
    
    const response = await fileApi.getBatch(task.file_ids)
    if (response.success && response.data) {
      taskFiles.value.set(taskId, response.data)
    } else {
      taskFiles.value.set(taskId, [])
    }
  } catch (error: any) {
    console.error('Failed to load files:', error)
    showError('Failed to load files')
    taskFiles.value.set(taskId, [])
  } finally {
    loadingFiles.value.set(taskId, false)
  }
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
}

async function handleDownloadFile(fileId: number, filename: string) {
  try {
    const blob = await fileApi.download(fileId)
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    window.URL.revokeObjectURL(url)
  } catch (error: any) {
    showError(error.response?.data?.error_message || 'Failed to download file')
  }
}

async function openPreview(file: FileResponse) {
  const supportsPreview = isImage(file.mime_type) || isVideo(file.mime_type) || isPDF(file.mime_type)
  if (supportsPreview) {
    previewFile.value = file
    showPreviewModal.value = true
    await getPreviewUrl(file)
  }
}

function closePreview() {
  showPreviewModal.value = false
  previewFile.value = null
  previewUrls.value.forEach(url => window.URL.revokeObjectURL(url))
  previewUrls.value.clear()
}

function getThumbnailUrl(file: FileResponse): string | null {
  if (file.thumbnail_path) {
    return fileApi.getThumbnailUrl(file.id)
  }
  return null
}

const previewUrls = ref<Map<number, string>>(new Map())

async function getPreviewUrl(file: FileResponse): Promise<string> {
  if (previewUrls.value.has(file.id)) {
    return previewUrls.value.get(file.id)!
  }
  
  try {
    const blob = await fileApi.download(file.id)
    const url = window.URL.createObjectURL(blob)
    previewUrls.value.set(file.id, url)
    return url
  } catch (error: any) {
    showError('Failed to load preview')
    throw error
  }
}

function isImage(mimeType: string): boolean {
  return mimeType.startsWith('image/')
}

function isVideo(mimeType: string): boolean {
  return mimeType.startsWith('video/')
}

function isPDF(mimeType: string): boolean {
  return mimeType === 'application/pdf'
}

async function openEditTaskModal(task: Task) {
  selectedTask.value = task
  editTaskForm.value = {
    title: task.title,
    description: task.description || '',
    status: task.status,
    assigned_to: task.assigned_to || 0,
    due_date: task.due_date ? task.due_date.split('T')[0] : undefined,
  }
  pendingFiles.value.clear()
  await loadTaskFiles(task.id)
  await loadPendingFilesFromStorage(true, task.id)
  showEditTaskModal.value = true
}

async function handleUpdateTask() {
  if (!selectedTask.value) return

  const existingFileIds = taskFiles.value.get(selectedTask.value.id)?.map(f => f.id) || []
  const newFileIds = Array.from(pendingFiles.value.values())
    .filter(f => f.fileId !== undefined)
    .map(f => f.fileId!)
  const allFileIds = [...existingFileIds, ...newFileIds]

  const payload: UpdateTaskPayload = {
    title: editTaskForm.value.title,
    description: editTaskForm.value.description || undefined,
    status: editTaskForm.value.status,
    assigned_to: editTaskForm.value.assigned_to || undefined,
    due_date: editTaskForm.value.due_date || undefined,
    file_ids: allFileIds.length > 0 ? allFileIds : undefined,
  }

  const result = await tasksStore.updateTask(selectedTask.value.id, payload)
  if (result.success) {
    const taskId = selectedTask.value.id
    showEditTaskModal.value = false
    selectedTask.value = null
    pendingFiles.value.clear()
    clearPendingFilesFromStorage(true, taskId)
    await loadTaskFiles(taskId)
    await tasksStore.fetchTasks({ project_id: projectId.value })
  }
}

function openDeleteTaskModal(taskId: number) {
  taskToDelete.value = taskId
  showDeleteTaskModal.value = true
}

async function handleDeleteTask() {
  if (taskToDelete.value === null) return
  await tasksStore.deleteTask(taskToDelete.value)
  showDeleteTaskModal.value = false
  taskToDelete.value = null
}

async function toggleWatch(task: Task) {
  if (watchingTasks.value.has(task.id)) return
  
  watchingTasks.value.add(task.id)
  const isWatching = task.watchers?.some(w => w.user_id === authStore.user?.id)
  
  try {
    if (isWatching) {
      await tasksStore.stopWatching(task.id)
    } else {
      await tasksStore.startWatching(task.id)
    }
  } finally {
    watchingTasks.value.delete(task.id)
  }
}

function getStatusColor(status: string) {
  const colors: Record<string, string> = {
    TODO: 'bg-zinc-500/20 text-zinc-400',
    IN_PROGRESS: 'bg-blue-500/20 text-blue-400',
    DONE: 'bg-green-500/20 text-green-400',
    BLOCKED: 'bg-red-500/20 text-red-400',
  }
  return colors[status] || 'bg-zinc-500/20 text-zinc-400'
}

function getUserName(userId: number | null) {
  if (!userId) return 'Unassigned'
  const user = usersStore.users.find(u => u.id === userId)
  return user ? user.name : `User ${userId}`
}

function isWatching(task: Task) {
  return task.watchers?.some(w => w.user_id === authStore.user?.id) || false
}

function getWatcherName(watcherUserId: number): string {
  const user = usersStore.users.find(u => u.id === watcherUserId)
  return user ? user.name : `User ${watcherUserId}`
}

function toggleWatchersVisibility(taskId: number) {
  if (expandedWatchers.value.has(taskId)) {
    expandedWatchers.value.delete(taskId)
  } else {
    expandedWatchers.value.add(taskId)
  }
}

function toggleFilesVisibility(taskId: number) {
  if (expandedFiles.value.has(taskId)) {
    expandedFiles.value.delete(taskId)
  } else {
    expandedFiles.value.add(taskId)
    // Always load files when accordion opens (if not already loading)
    if (!loadingFiles.value.get(taskId)) {
      loadTaskFiles(taskId)
    }
  }
}

function openAddMemberModal() {
  addMemberForm.value = { user_id: 0 }
  showAddMemberModal.value = true
}

async function handleAddMember() {
  const payload: AddMemberPayload = {
    user_id: addMemberForm.value.user_id,
  }

  const result = await projectsStore.addMember(projectId.value, payload)
  if (result.success) {
    showAddMemberModal.value = false
    addMemberForm.value = { user_id: 0 }
  }
}

function openDeleteMemberModal(userId: number) {
  memberToDelete.value = userId
  showDeleteMemberModal.value = true
}

async function handleRemoveMember() {
  if (memberToDelete.value === null) return
  await projectsStore.removeMember(projectId.value, memberToDelete.value)
  showDeleteMemberModal.value = false
  memberToDelete.value = null
}

function getMemberName(userId: number) {
  const user = usersStore.users.find(u => u.id === userId)
  return user ? user.name : `User ${userId}`
}

onMounted(async () => {
  await projectsStore.fetchProject(projectId.value)
  await tasksStore.fetchTasks({ project_id: projectId.value })
  await usersStore.fetchUsers()
})
</script>

<template>
  <Layout>
    <div class="p-4 lg:p-6">
      <button
        @click="router.push('/projects')"
        class="mb-4 text-indigo-400 hover:text-indigo-300 flex items-center gap-2 cursor-pointer"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
        </svg>
        Back to Projects
      </button>

      <div v-if="projectsStore.currentProject" class="mb-6">
        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
          <div>
            <h2 class="text-xl lg:text-2xl font-semibold text-white">{{ projectsStore.currentProject.name }}</h2>
            <p class="text-zinc-400 mt-1 text-sm lg:text-base">{{ projectsStore.currentProject.description || 'No description' }}</p>
          </div>
        </div>
        <div class="flex flex-wrap gap-4 text-sm text-zinc-400">
          <span :class="['inline-flex items-center px-2 py-1 rounded-md text-xs font-medium capitalize', getStatusColor(projectsStore.currentProject.status)]">
            {{ projectsStore.currentProject.status }}
          </span>
          <span v-if="projectsStore.currentProject.start_date">
            Start: {{ new Date(projectsStore.currentProject.start_date).toLocaleDateString() }}
          </span>
          <span v-if="projectsStore.currentProject.end_date">
            End: {{ new Date(projectsStore.currentProject.end_date).toLocaleDateString() }}
          </span>
        </div>
      </div>

      <div v-if="projectsStore.currentProject" class="mb-6">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-lg font-semibold text-white">Members</h3>
          <button
            @click="openAddMemberModal"
            class="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors cursor-pointer"
          >
            Add Member
          </button>
        </div>
        <div class="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-2xl overflow-hidden">
          <div v-if="projectsStore.currentProject.members && projectsStore.currentProject.members.length > 0" class="divide-y divide-[var(--color-border)]">
            <div
              v-for="member in projectsStore.currentProject.members"
              :key="member.id"
              class="p-4 flex items-center justify-between hover:bg-[var(--color-bg-elevated)]"
            >
              <div>
                <p class="text-white font-medium">{{ getMemberName(member.user_id) }}</p>
                <p class="text-xs text-zinc-400">
                  Joined: {{ member.joined_at ? new Date(member.joined_at).toLocaleDateString() : 'Unknown' }}
                </p>
              </div>
              <button
                v-if="projectsStore.currentProject?.created_by !== member.user_id"
                @click="openDeleteMemberModal(member.user_id)"
                class="text-red-400 hover:text-red-300 cursor-pointer"
                title="Remove member"
              >
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          </div>
          <div v-else class="p-8 text-center text-zinc-400">
            No members yet
          </div>
        </div>
      </div>

      <div class="mb-6">
        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
          <h3 class="text-lg font-semibold text-white">Tasks</h3>
          <button
            v-if="canCreateTask"
            @click="openCreateTaskModal"
            class="w-full sm:w-auto px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors cursor-pointer"
          >
            Create Task
          </button>
        </div>

        <div class="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-2xl overflow-hidden">
          <div v-if="tasksStore.loading" class="p-8 text-center">
            <p class="text-zinc-400">Loading tasks...</p>
          </div>
          <div v-else-if="tasksStore.tasks.length === 0" class="p-8 text-center">
            <p class="text-zinc-400">No tasks found</p>
          </div>
          <div v-else class="divide-y divide-[var(--color-border)]">
            <div
              v-for="task in tasksStore.tasks"
              :key="task.id"
              class="p-4 hover:bg-[var(--color-bg-elevated)] transition-colors"
            >
              <div class="flex items-start justify-between gap-4">
                <div class="flex-1 min-w-0">
                  <div class="flex items-center gap-3 mb-2">
                    <span :class="['inline-flex items-center px-2 py-1 rounded-md text-xs font-medium', getStatusColor(task.status)]">
                      {{ task.status }}
                    </span>
                    <h4 class="text-base font-medium text-white">{{ task.title }}</h4>
                  </div>
                  <p v-if="task.description" class="text-sm text-zinc-400 mb-2">{{ task.description }}</p>
                  <div class="flex flex-wrap gap-4 text-xs text-zinc-400">
                    <span>Assigned to: {{ getUserName(task.assigned_to) }}</span>
                    <span v-if="task.due_date">Due: {{ new Date(task.due_date).toLocaleDateString() }}</span>
                    <span v-if="task.watchers && task.watchers.length > 0">
                      {{ task.watchers.length }} watcher{{ task.watchers.length > 1 ? 's' : '' }}
                    </span>
                  </div>
                </div>
                <div class="flex items-center gap-2">
                  <button
                    @click="toggleWatch(task)"
                    :disabled="watchingTasks.has(task.id)"
                    :class="[
                      'p-2 rounded-lg transition-all duration-300 cursor-pointer transform',
                      watchingTasks.has(task.id)
                        ? 'opacity-50 cursor-not-allowed scale-95'
                        : 'hover:scale-110',
                      isWatching(task)
                        ? 'bg-indigo-600/20 text-indigo-400 hover:bg-indigo-600/30 shadow-lg shadow-indigo-500/20'
                        : 'bg-zinc-700/50 text-zinc-400 hover:bg-zinc-700 hover:text-zinc-300'
                    ]"
                    :title="isWatching(task) ? 'Stop watching' : 'Watch task'"
                  >
                    <svg
                      v-if="watchingTasks.has(task.id)"
                      class="w-5 h-5 animate-spin"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    <svg
                      v-else-if="isWatching(task)"
                      class="w-5 h-5 transition-all duration-300"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/>
                    </svg>
                    <svg
                      v-else
                      class="w-5 h-5 transition-all duration-300"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  </button>
                  <button
                    v-if="canEditTask"
                    @click="openEditTaskModal(task)"
                    class="p-2 text-indigo-400 hover:text-indigo-300 cursor-pointer"
                    title="Edit task"
                  >
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button
                    v-if="canDeleteTask"
                    @click="openDeleteTaskModal(task.id)"
                    class="p-2 text-red-400 hover:text-red-300 cursor-pointer"
                    title="Delete task"
                  >
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
              
              <div class="mt-3 border-t border-[var(--color-border)] pt-3">
                <button
                  @click="toggleWatchersVisibility(task.id)"
                  class="w-full flex items-center justify-between text-sm text-zinc-400 hover:text-zinc-300 transition-colors cursor-pointer"
                >
                  <span class="flex items-center gap-2">
                    <svg
                      class="w-4 h-4 transition-transform duration-200"
                      :class="{ 'rotate-90': expandedWatchers.has(task.id) }"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                    </svg>
                    <span>
                      {{ task.watchers && task.watchers.length > 0 
                        ? `${task.watchers.length} Watcher${task.watchers.length > 1 ? 's' : ''}` 
                        : 'Watchers' }}
                    </span>
                  </span>
                </button>
                <div
                  v-show="expandedWatchers.has(task.id)"
                  class="mt-2 pl-6 space-y-2 animate-fade-in"
                >
                  <div
                    v-if="task.watchers && task.watchers.length > 0"
                  >
                    <div
                      v-for="watcher in task.watchers"
                      :key="watcher.id"
                      class="flex items-center gap-2 text-sm text-zinc-400"
                    >
                      <svg class="w-4 h-4 text-indigo-400" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/>
                      </svg>
                      <span>{{ getWatcherName(watcher.user_id) }}</span>
                      <span v-if="watcher.user_id === authStore.user?.id" class="text-xs text-indigo-400">(You)</span>
                    </div>
                  </div>
                  <div v-else class="text-sm text-zinc-500 italic">
                    No watchers yet
                  </div>
                </div>
              </div>
              
              <div class="mt-3 border-t border-[var(--color-border)] pt-3">
                <button
                  @click="toggleFilesVisibility(task.id)"
                  class="w-full flex items-center justify-between text-sm text-zinc-400 hover:text-zinc-300 transition-colors cursor-pointer"
                >
                  <span class="flex items-center gap-2">
                    <svg
                      class="w-4 h-4 transition-transform duration-200"
                      :class="{ 'rotate-90': expandedFiles.has(task.id) }"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                    </svg>
                    <span>
                      {{ taskFiles.get(task.id) && taskFiles.get(task.id)!.length > 0
                        ? `${taskFiles.get(task.id)!.length} File${taskFiles.get(task.id)!.length > 1 ? 's' : ''}`
                        : 'Files' }}
                    </span>
                  </span>
                </button>
                <div
                  v-show="expandedFiles.has(task.id)"
                  class="mt-2 pl-6 space-y-2 animate-fade-in"
                >
                  <div v-if="loadingFiles.get(task.id)" class="text-sm text-zinc-500 italic">
                    Loading files...
                  </div>
                  <div v-else-if="taskFiles.get(task.id) && taskFiles.get(task.id)!.length > 0" class="space-y-2">
                    <div
                      v-for="file in taskFiles.get(task.id)"
                      :key="file.id"
                      class="flex items-center gap-3 p-2 bg-[var(--color-bg-elevated)] rounded-lg hover:bg-[var(--color-bg-hover)] transition-colors"
                    >
                      <div class="flex-shrink-0">
                        <div v-if="getThumbnailUrl(file)" class="w-12 h-12 rounded overflow-hidden bg-[var(--color-bg)] flex items-center justify-center">
                          <img 
                            :src="getThumbnailUrl(file)!" 
                            :alt="file.original_name"
                            class="w-full h-full object-cover"
                            @error="(e) => { (e.target as HTMLImageElement).style.display = 'none' }"
                          />
                        </div>
                        <div v-else class="w-12 h-12 rounded bg-[var(--color-bg)] flex items-center justify-center">
                          <svg class="w-6 h-6 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                          </svg>
                        </div>
                      </div>
                      <div class="flex-1 min-w-0">
                        <p class="text-sm text-white truncate">{{ file.original_name }}</p>
                        <p class="text-xs text-zinc-400">{{ formatFileSize(file.size) }}</p>
                      </div>
                      <div class="flex items-center gap-2">
                        <button
                          v-if="isImage(file.mime_type) || isVideo(file.mime_type) || isPDF(file.mime_type)"
                          @click="openPreview(file)"
                          class="p-1.5 text-indigo-400 hover:text-indigo-300 cursor-pointer rounded hover:bg-indigo-400/10 transition-colors"
                          title="Preview file"
                        >
                          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        </button>
                        <button
                          @click="handleDownloadFile(file.id, file.original_name)"
                          class="p-1.5 text-indigo-400 hover:text-indigo-300 cursor-pointer rounded hover:bg-indigo-400/10 transition-colors"
                          title="Download file"
                        >
                          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                          </svg>
                        </button>
                        <button
                          @click="handleDeleteTaskFile(task.id, file.id)"
                          class="p-1.5 text-red-400 hover:text-red-300 cursor-pointer rounded hover:bg-red-400/10 transition-colors"
                          title="Delete file"
                        >
                          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                  <div v-else class="text-sm text-zinc-500 italic">
                    No files attached
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Modal :is-open="showCreateTaskModal" title="Create Task" @close="showCreateTaskModal = false" size="lg">
        <form @submit.prevent="handleCreateTask" class="space-y-4">
          <div>
            <label for="create-task-title" class="block text-sm font-medium text-zinc-400 mb-2">Title *</label>
            <input
              id="create-task-title"
              v-model="createTaskForm.title"
              type="text"
              required
              class="w-full px-4 py-2 bg-[var(--color-bg-elevated)] border border-[var(--color-border)] rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label for="create-task-description" class="block text-sm font-medium text-zinc-400 mb-2">Description</label>
            <textarea
              id="create-task-description"
              v-model="createTaskForm.description"
              rows="3"
              class="w-full px-4 py-2 bg-[var(--color-bg-elevated)] border border-[var(--color-border)] rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label for="create-task-status" class="block text-sm font-medium text-zinc-400 mb-2">Status</label>
              <select
                id="create-task-status"
                v-model="createTaskForm.status"
                class="w-full px-4 py-2 bg-[var(--color-bg-elevated)] border border-[var(--color-border)] rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
              >
                <option value="TODO">TODO</option>
                <option value="IN_PROGRESS">IN_PROGRESS</option>
                <option value="DONE">DONE</option>
                <option value="BLOCKED">BLOCKED</option>
              </select>
            </div>
            <div>
              <label for="create-task-assigned" class="block text-sm font-medium text-zinc-400 mb-2">Assign To</label>
              <select
                id="create-task-assigned"
                v-model.number="createTaskForm.assigned_to"
                class="w-full px-4 py-2 bg-[var(--color-bg-elevated)] border border-[var(--color-border)] rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
              >
                <option :value="0">Unassigned</option>
                <option
                  v-for="user in usersStore.users"
                  :key="user.id"
                  :value="user.id"
                >
                  {{ user.name }} ({{ user.email }})
                </option>
              </select>
            </div>
          </div>
          <div>
            <label for="create-task-due-date" class="block text-sm font-medium text-zinc-400 mb-2">Due Date</label>
            <input
              id="create-task-due-date"
              v-model="createTaskForm.due_date"
              type="date"
              class="w-full px-4 py-2 bg-[var(--color-bg-elevated)] border border-[var(--color-border)] rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
            />
          </div>
          
          <div>
            <label class="block text-sm font-medium text-zinc-400 mb-2">Attachments</label>
            <div class="space-y-3">
              <div class="flex items-center gap-2">
                <input
                  type="file"
                  multiple
                  accept="image/*,video/*,.pdf,application/pdf"
                  @change="handleFileUpload($event)"
                  class="hidden"
                  id="create-task-files"
                  ref="createTaskFileInput"
                />
                <label
                  for="create-task-files"
                  class="flex-1 px-4 py-2 bg-[var(--color-bg-elevated)] border border-[var(--color-border)] rounded-lg text-zinc-400 hover:text-white cursor-pointer text-center transition-colors"
                >
                  <span class="flex items-center justify-center gap-2">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                    </svg>
                    Attach Files
                  </span>
                </label>
              </div>
              
              <div v-if="pendingFiles.size > 0" class="space-y-2">
                <div
                  v-for="[fileId, pendingFile] in pendingFiles"
                  :key="fileId"
                  class="p-3 bg-[var(--color-bg-elevated)] border border-[var(--color-border)] rounded-lg"
                >
                  <div class="flex items-center justify-between gap-2">
                    <div class="flex-1 min-w-0">
                      <p class="text-sm text-white truncate">{{ pendingFile.original_name || pendingFile.file?.name || 'Unknown' }}</p>
                      <p class="text-xs text-zinc-400">{{ formatFileSize(pendingFile.size || pendingFile.file?.size || 0) }}</p>
                      <div v-if="pendingFile.isUploading" class="mt-2">
                        <div class="w-full bg-zinc-700 rounded-full h-1.5">
                          <div
                            class="bg-indigo-600 h-1.5 rounded-full transition-all duration-300"
                            :style="{ width: `${pendingFile.uploadProgress}%` }"
                          ></div>
                        </div>
                        <p class="text-xs text-zinc-400 mt-1">{{ pendingFile.uploadProgress }}%</p>
                      </div>
                      <p v-if="pendingFile.error" class="text-xs text-red-400 mt-1">{{ pendingFile.error }}</p>
                      <p v-if="!pendingFile.isUploading && !pendingFile.error && pendingFile.fileId" class="text-xs text-green-400 mt-1">✓ Uploaded</p>
                    </div>
                    <button
                      type="button"
                      @click.stop="handleDetachFile(fileId)"
                      class="p-1 text-red-400 hover:text-red-300 cursor-pointer"
                      title="Remove file"
                    >
                      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div class="flex gap-3 pt-4">
            <button
              type="button"
              @click="showCreateTaskModal = false"
              class="flex-1 px-4 py-2 border border-[var(--color-border)] text-zinc-400 hover:text-white rounded-lg transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              class="flex-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors cursor-pointer"
            >
              Create
            </button>
          </div>
        </form>
      </Modal>

      <Modal :is-open="showEditTaskModal" title="Edit Task" @close="showEditTaskModal = false" size="lg">
        <form @submit.prevent="handleUpdateTask" class="space-y-4">
          <div>
            <label for="edit-task-title" class="block text-sm font-medium text-zinc-400 mb-2">Title *</label>
            <input
              id="edit-task-title"
              v-model="editTaskForm.title"
              type="text"
              required
              class="w-full px-4 py-2 bg-[var(--color-bg-elevated)] border border-[var(--color-border)] rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label for="edit-task-description" class="block text-sm font-medium text-zinc-400 mb-2">Description</label>
            <textarea
              id="edit-task-description"
              v-model="editTaskForm.description"
              rows="3"
              class="w-full px-4 py-2 bg-[var(--color-bg-elevated)] border border-[var(--color-border)] rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label for="edit-task-status" class="block text-sm font-medium text-zinc-400 mb-2">Status</label>
              <select
                id="edit-task-status"
                v-model="editTaskForm.status"
                class="w-full px-4 py-2 bg-[var(--color-bg-elevated)] border border-[var(--color-border)] rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
              >
                <option value="TODO">TODO</option>
                <option value="IN_PROGRESS">IN_PROGRESS</option>
                <option value="DONE">DONE</option>
                <option value="BLOCKED">BLOCKED</option>
              </select>
            </div>
            <div>
              <label for="edit-task-assigned" class="block text-sm font-medium text-zinc-400 mb-2">Assign To</label>
              <select
                id="edit-task-assigned"
                v-model.number="editTaskForm.assigned_to"
                class="w-full px-4 py-2 bg-[var(--color-bg-elevated)] border border-[var(--color-border)] rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
              >
                <option :value="0">Unassigned</option>
                <option
                  v-for="user in usersStore.users"
                  :key="user.id"
                  :value="user.id"
                >
                  {{ user.name }} ({{ user.email }})
                </option>
              </select>
            </div>
          </div>
          <div>
            <label for="edit-task-due-date" class="block text-sm font-medium text-zinc-400 mb-2">Due Date</label>
            <input
              id="edit-task-due-date"
              v-model="editTaskForm.due_date"
              type="date"
              class="w-full px-4 py-2 bg-[var(--color-bg-elevated)] border border-[var(--color-border)] rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
            />
          </div>
          
          <div>
            <label class="block text-sm font-medium text-zinc-400 mb-2">Attachments</label>
            <div class="space-y-3">
              <div class="flex items-center gap-2">
                <input
                  type="file"
                  multiple
                  accept="image/*,video/*,.pdf,application/pdf"
                  @change="handleFileUpload($event)"
                  class="hidden"
                  id="edit-task-files"
                />
                <label
                  for="edit-task-files"
                  class="flex-1 px-4 py-2 bg-[var(--color-bg-elevated)] border border-[var(--color-border)] rounded-lg text-zinc-400 hover:text-white cursor-pointer text-center transition-colors"
                >
                  <span class="flex items-center justify-center gap-2">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                    </svg>
                    Attach Files
                  </span>
                </label>
              </div>
              
              <div v-if="selectedTask && taskFiles.get(selectedTask.id)?.length" class="space-y-2">
                <div
                  v-for="file in taskFiles.get(selectedTask.id)"
                  :key="file.id"
                  class="p-3 bg-[var(--color-bg-elevated)] border border-[var(--color-border)] rounded-lg flex items-center gap-3"
                >
                  <div class="flex-shrink-0">
                    <div v-if="getThumbnailUrl(file)" class="w-12 h-12 rounded overflow-hidden bg-[var(--color-bg)] flex items-center justify-center">
                      <img 
                        :src="getThumbnailUrl(file)!" 
                        :alt="file.original_name"
                        class="w-full h-full object-cover"
                        @error="(e) => { (e.target as HTMLImageElement).style.display = 'none' }"
                      />
                    </div>
                    <div v-else class="w-12 h-12 rounded bg-[var(--color-bg)] flex items-center justify-center">
                      <svg class="w-6 h-6 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                      </svg>
                    </div>
                  </div>
                  <div class="flex-1 min-w-0">
                    <p class="text-sm text-white truncate">{{ file.original_name }}</p>
                    <p class="text-xs text-zinc-400">{{ formatFileSize(file.size) }}</p>
                  </div>
                  <div class="flex items-center gap-2">
                    <button
                      v-if="file.supports_preview"
                      @click="openPreview(file)"
                      class="p-1.5 text-indigo-400 hover:text-indigo-300 cursor-pointer rounded hover:bg-indigo-400/10 transition-colors"
                      title="Preview file"
                    >
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    </button>
                    <button
                      @click="handleDeleteTaskFile(selectedTask.id, file.id)"
                      class="p-1.5 text-red-400 hover:text-red-300 cursor-pointer rounded hover:bg-red-400/10 transition-colors"
                      title="Delete file"
                    >
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
              
              <div v-if="pendingFiles.size > 0" class="space-y-2">
                <div
                  v-for="[fileId, pendingFile] in pendingFiles"
                  :key="fileId"
                  class="p-3 bg-[var(--color-bg-elevated)] border border-[var(--color-border)] rounded-lg"
                >
                  <div class="flex items-center justify-between gap-2">
                    <div class="flex-1 min-w-0">
                      <p class="text-sm text-white truncate">{{ pendingFile.original_name || pendingFile.file?.name || 'Unknown' }}</p>
                      <p class="text-xs text-zinc-400">{{ formatFileSize(pendingFile.size || pendingFile.file?.size || 0) }}</p>
                      <div v-if="pendingFile.isUploading" class="mt-2">
                        <div class="w-full bg-zinc-700 rounded-full h-1.5">
                          <div
                            class="bg-indigo-600 h-1.5 rounded-full transition-all duration-300"
                            :style="{ width: `${pendingFile.uploadProgress}%` }"
                          ></div>
                        </div>
                        <p class="text-xs text-zinc-400 mt-1">{{ pendingFile.uploadProgress }}%</p>
                      </div>
                      <p v-if="pendingFile.error" class="text-xs text-red-400 mt-1">{{ pendingFile.error }}</p>
                      <p v-if="!pendingFile.isUploading && !pendingFile.error && pendingFile.fileId" class="text-xs text-green-400 mt-1">✓ Uploaded</p>
                    </div>
                    <button
                      type="button"
                      @click.stop="handleDetachFile(fileId)"
                      class="p-1 text-red-400 hover:text-red-300 cursor-pointer"
                      title="Remove file"
                    >
                      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div class="flex gap-3 pt-4">
            <button
              type="button"
              @click="showEditTaskModal = false"
              class="flex-1 px-4 py-2 border border-[var(--color-border)] text-zinc-400 hover:text-white rounded-lg transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              class="flex-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors cursor-pointer"
            >
              Update
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmModal
        :is-open="showDeleteTaskModal"
        title="Delete Task"
        message="Are you sure you want to delete this task? This action cannot be undone."
        @confirm="handleDeleteTask"
        @close="showDeleteTaskModal = false"
      />

      <Modal :is-open="showAddMemberModal" title="Add Member" @close="showAddMemberModal = false">
        <form @submit.prevent="handleAddMember" class="space-y-4">
          <div>
            <label for="add-member-user" class="block text-sm font-medium text-zinc-400 mb-2">User *</label>
            <select
              id="add-member-user"
              v-model.number="addMemberForm.user_id"
              required
              class="w-full px-4 py-2 bg-[var(--color-bg-elevated)] border border-[var(--color-border)] rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
            >
              <option :value="0">Select a user</option>
              <option
                v-for="user in usersStore.users.filter(u => {
                  const isAlreadyMember = projectsStore.currentProject?.members?.some(m => m.user_id === u.id)
                  const isSuperAdminOrProjectManager = u.roles?.includes('super-admin') || u.roles?.includes('project-manager')
                  return !isAlreadyMember && !isSuperAdminOrProjectManager
                })"
                :key="user.id"
                :value="user.id"
              >
                {{ user.name }} ({{ user.email }})
              </option>
            </select>
          </div>
          <div class="flex gap-3 pt-4">
            <button
              type="button"
              @click="showAddMemberModal = false"
              class="flex-1 px-4 py-2 border border-[var(--color-border)] text-zinc-400 hover:text-white rounded-lg transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              class="flex-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors cursor-pointer"
            >
              Add
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmModal
        :is-open="showDeleteMemberModal"
        title="Remove Member"
        :message="`Are you sure you want to remove ${memberToDelete ? getMemberName(memberToDelete) : 'this member'} from the project?`"
        @confirm="handleRemoveMember"
        @close="showDeleteMemberModal = false"
      />

      <Modal :is-open="showPreviewModal" @close="closePreview" :title="previewFile?.original_name || 'Preview'">
        <div v-if="previewFile" class="max-h-[80vh] overflow-auto">
          <div v-if="isImage(previewFile.mime_type)" class="flex justify-center">
            <img 
              v-if="previewUrls.get(previewFile.id)"
              :src="previewUrls.get(previewFile.id)!" 
              :alt="previewFile.original_name"
              class="max-w-full max-h-[70vh] object-contain rounded-lg"
            />
            <div v-else class="text-center py-8 text-zinc-400">Loading preview...</div>
          </div>
          <div v-else-if="isVideo(previewFile.mime_type)" class="flex justify-center">
            <video 
              v-if="previewUrls.get(previewFile.id)"
              :src="previewUrls.get(previewFile.id)!" 
              controls
              class="max-w-full max-h-[70vh] rounded-lg"
            >
              Your browser does not support the video tag.
            </video>
            <div v-else class="text-center py-8 text-zinc-400">Loading preview...</div>
          </div>
          <div v-else-if="isPDF(previewFile.mime_type)" class="w-full h-[70vh]">
            <iframe 
              v-if="previewUrls.get(previewFile.id)"
              :src="previewUrls.get(previewFile.id)!" 
              class="w-full h-full rounded-lg border-0"
              type="application/pdf"
            />
            <div v-else class="text-center py-8 text-zinc-400">Loading preview...</div>
          </div>
          <div v-else class="text-center py-8">
            <p class="text-zinc-400 mb-4">Preview not available for this file type.</p>
            <button
              @click="handleDownloadFile(previewFile.id, previewFile.original_name)"
              class="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
            >
              Download to view
            </button>
          </div>
        </div>
      </Modal>
    </div>
  </Layout>
</template>

<style scoped>
@keyframes fade-in {
  from {
    opacity: 0;
    transform: translateY(-4px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-fade-in {
  animation: fade-in 0.2s ease-out;
}
</style>

