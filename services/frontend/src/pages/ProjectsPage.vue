<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import Layout from '@/components/Layout.vue'
import Modal from '@/components/Modal.vue'
import ConfirmModal from '@/components/ConfirmModal.vue'
import { useProjectsStore } from '@/stores/projects'
import { useUsersStore } from '@/stores/users'
import { useAuthStore } from '@/stores/auth'
import type { Project } from '@/types/projects'
import type { CreateProjectPayload, UpdateProjectPayload } from '@/types/projects'

const projectsStore = useProjectsStore()
const usersStore = useUsersStore()
const authStore = useAuthStore()

const canCreateProject = computed(() => {
  const roles = authStore.user?.roles || []
  return roles.includes('super-admin') || roles.includes('project-manager')
})

const canDeleteProject = computed(() => {
  const permissions = authStore.user?.permissions || []
  return permissions.includes('project:delete')
})

function canDeleteProjectFor(_project: Project): boolean {
  return canDeleteProject.value
}

const showCreateModal = ref(false)
const showEditModal = ref(false)
const showDeleteModal = ref(false)
const selectedProject = ref<Project | null>(null)
const projectToDelete = ref<number | null>(null)

const createForm = ref({
  name: '',
  description: '',
  start_date: '',
  end_date: '',
})

const editForm = ref<{
  name: string
  description: string
  status: 'active' | 'archived' | 'completed'
  start_date: string | undefined
  end_date: string | undefined
}>({
  name: '',
  description: '',
  status: 'active',
  start_date: undefined,
  end_date: undefined,
})


function openCreateModal() {
  createForm.value = { name: '', description: '', start_date: '', end_date: '' }
  showCreateModal.value = true
}

async function handleCreate() {
  const payload: CreateProjectPayload = {
    name: createForm.value.name,
    description: createForm.value.description || undefined,
    start_date: createForm.value.start_date || undefined,
    end_date: createForm.value.end_date || undefined,
  }

  const result = await projectsStore.createProject(payload)
  if (result.success) {
    showCreateModal.value = false
  }
}

function openEditModal(project: Project) {
  selectedProject.value = project
  editForm.value = {
    name: project.name,
    description: project.description || '',
    status: project.status,
    start_date: project.start_date ? project.start_date.split('T')[0] : undefined,
    end_date: project.end_date ? project.end_date.split('T')[0] : undefined,
  }
  showEditModal.value = true
}

async function handleUpdate() {
  if (!selectedProject.value) return

  const payload: UpdateProjectPayload = {
    name: editForm.value.name,
    description: editForm.value.description || undefined,
    status: editForm.value.status,
    start_date: editForm.value.start_date || undefined,
    end_date: editForm.value.end_date || undefined,
  }

  const result = await projectsStore.updateProject(selectedProject.value.id, payload)
  if (result.success) {
    showEditModal.value = false
    selectedProject.value = null
  }
}

function openDeleteModal(projectId: number) {
  projectToDelete.value = projectId
  showDeleteModal.value = true
}

async function handleDelete() {
  if (projectToDelete.value === null) return
  await projectsStore.deleteProject(projectToDelete.value)
  showDeleteModal.value = false
  projectToDelete.value = null
}

function getStatusColor(status: string) {
  const colors: Record<string, string> = {
    active: 'bg-green-500/20 text-green-400',
    archived: 'bg-zinc-500/20 text-zinc-400',
    completed: 'bg-blue-500/20 text-blue-400',
  }
  return colors[status] || 'bg-zinc-500/20 text-zinc-400'
}


onMounted(() => {
  projectsStore.fetchProjects()
  usersStore.fetchUsers()
})
</script>

<template>
  <Layout>
    <div class="p-4 lg:p-6">
      <!-- Header -->
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h2 class="text-xl lg:text-2xl font-semibold text-white">Projects</h2>
          <p class="text-zinc-400 mt-1 text-sm lg:text-base">Manage your projects</p>
        </div>
        <button
          v-if="canCreateProject"
          @click="openCreateModal"
          class="w-full sm:w-auto px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors cursor-pointer"
        >
          Create Project
        </button>
      </div>

      <!-- Projects Table -->
      <div class="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-2xl overflow-hidden">
        <div v-if="projectsStore.loading" class="p-8 text-center">
          <p class="text-zinc-400">Loading projects...</p>
        </div>
        <div v-else-if="projectsStore.projects.length === 0" class="p-8 text-center">
          <p class="text-zinc-400">No projects found</p>
        </div>
        <!-- Desktop Table -->
        <div class="hidden lg:block overflow-x-auto">
          <table class="w-full">
            <thead class="bg-[var(--color-bg-elevated)] border-b border-[var(--color-border)]">
              <tr>
                <th class="px-6 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">Name</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">Description</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">Status</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">Dates</th>
                <th class="px-6 py-3 text-right text-xs font-medium text-zinc-400 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-[var(--color-border)]">
              <tr v-for="project in projectsStore.projects" :key="project.id" class="hover:bg-[var(--color-bg-elevated)]">
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="text-sm font-medium text-white">{{ project.name }}</div>
                </td>
                <td class="px-6 py-4">
                  <div class="text-sm text-zinc-400 max-w-xs truncate">{{ project.description || 'No description' }}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <span :class="['inline-flex items-center px-2 py-1 rounded-md text-xs font-medium capitalize', getStatusColor(project.status)]">
                    {{ project.status.replace('_', ' ') }}
                  </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="text-sm text-zinc-400">
                    <div v-if="project.start_date">{{ new Date(project.start_date).toLocaleDateString() }}</div>
                    <div v-else class="text-zinc-500">No start date</div>
                  </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <router-link
                    :to="`/projects/${project.id}`"
                    class="text-indigo-400 hover:text-indigo-300 mr-4 cursor-pointer"
                  >
                    View
                  </router-link>
                  <button
                    @click="openEditModal(project)"
                    class="text-indigo-400 hover:text-indigo-300 mr-4 cursor-pointer"
                  >
                    Edit
                  </button>
                  <button
                    v-if="canDeleteProjectFor(project)"
                    @click="openDeleteModal(project.id)"
                    class="text-red-400 hover:text-red-300 cursor-pointer"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <!-- Mobile Cards -->
        <div class="lg:hidden divide-y divide-[var(--color-border)]">
          <div
            v-for="project in projectsStore.projects"
            :key="project.id"
            class="p-4 hover:bg-[var(--color-bg-elevated)]"
          >
            <div class="flex items-start justify-between mb-3">
              <div class="flex-1 min-w-0">
                <div class="text-base font-medium text-white truncate">{{ project.name }}</div>
                <div class="text-sm text-zinc-400 mt-1 line-clamp-2">{{ project.description || 'No description' }}</div>
              </div>
              <div class="flex gap-2 ml-4">
                <router-link
                  :to="`/projects/${project.id}`"
                  class="text-indigo-400 hover:text-indigo-300 cursor-pointer"
                  aria-label="View project"
                >
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                </router-link>
                <button
                  @click="openEditModal(project)"
                  class="text-indigo-400 hover:text-indigo-300 cursor-pointer"
                  aria-label="Edit project"
                >
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
                <button
                  v-if="canDeleteProjectFor(project)"
                  @click="openDeleteModal(project.id)"
                  class="text-red-400 hover:text-red-300 cursor-pointer"
                  aria-label="Delete project"
                >
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
            <div class="flex items-center gap-4 mt-3">
              <span :class="['inline-flex items-center px-2 py-1 rounded-md text-xs font-medium capitalize', getStatusColor(project.status)]">
                {{ project.status.replace('_', ' ') }}
              </span>
              <span v-if="project.start_date" class="text-xs text-zinc-400">
                {{ new Date(project.start_date).toLocaleDateString() }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- Create Modal -->
      <Modal :is-open="showCreateModal" title="Create Project" @close="showCreateModal = false" size="lg">
        <form @submit.prevent="handleCreate" class="space-y-4">
          <div>
            <label for="create-name" class="block text-sm font-medium text-zinc-400 mb-2">Name *</label>
            <input
              id="create-name"
              v-model="createForm.name"
              type="text"
              required
              class="w-full px-4 py-2 bg-[var(--color-bg-elevated)] border border-[var(--color-border)] rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label for="create-description" class="block text-sm font-medium text-zinc-400 mb-2">Description</label>
            <textarea
              id="create-description"
              v-model="createForm.description"
              rows="3"
              class="w-full px-4 py-2 bg-[var(--color-bg-elevated)] border border-[var(--color-border)] rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label for="create-start-date" class="block text-sm font-medium text-zinc-400 mb-2">Start Date</label>
              <input
                id="create-start-date"
                v-model="createForm.start_date"
                type="date"
                class="w-full px-4 py-2 bg-[var(--color-bg-elevated)] border border-[var(--color-border)] rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
              />
            </div>
            <div>
              <label for="create-end-date" class="block text-sm font-medium text-zinc-400 mb-2">End Date</label>
              <input
                id="create-end-date"
                v-model="createForm.end_date"
                type="date"
                class="w-full px-4 py-2 bg-[var(--color-bg-elevated)] border border-[var(--color-border)] rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
              />
            </div>
          </div>
          <div class="flex gap-3 pt-4">
            <button
              type="button"
              @click="showCreateModal = false"
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

      <!-- Edit Modal -->
      <Modal :is-open="showEditModal" title="Edit Project" @close="showEditModal = false" size="lg">
        <form @submit.prevent="handleUpdate" class="space-y-4">
          <div>
            <label for="edit-name" class="block text-sm font-medium text-zinc-400 mb-2">Name *</label>
            <input
              id="edit-name"
              v-model="editForm.name"
              type="text"
              required
              class="w-full px-4 py-2 bg-[var(--color-bg-elevated)] border border-[var(--color-border)] rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label for="edit-description" class="block text-sm font-medium text-zinc-400 mb-2">Description</label>
            <textarea
              id="edit-description"
              v-model="editForm.description"
              rows="3"
              class="w-full px-4 py-2 bg-[var(--color-bg-elevated)] border border-[var(--color-border)] rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label for="edit-status" class="block text-sm font-medium text-zinc-400 mb-2">Status</label>
            <select
              id="edit-status"
              v-model="editForm.status"
              class="w-full px-4 py-2 bg-[var(--color-bg-elevated)] border border-[var(--color-border)] rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
            >
              <option value="active">Active</option>
              <option value="archived">Archived</option>
              <option value="completed">Completed</option>
            </select>
          </div>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label for="edit-start-date" class="block text-sm font-medium text-zinc-400 mb-2">Start Date</label>
              <input
                id="edit-start-date"
                v-model="editForm.start_date"
                type="date"
                class="w-full px-4 py-2 bg-[var(--color-bg-elevated)] border border-[var(--color-border)] rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
              />
            </div>
            <div>
              <label for="edit-end-date" class="block text-sm font-medium text-zinc-400 mb-2">End Date</label>
              <input
                id="edit-end-date"
                v-model="editForm.end_date"
                type="date"
                class="w-full px-4 py-2 bg-[var(--color-bg-elevated)] border border-[var(--color-border)] rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
              />
            </div>
          </div>
          <div class="flex gap-3 pt-4">
            <button
              type="button"
              @click="showEditModal = false"
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

      <!-- Delete Project Confirmation Modal -->
      <ConfirmModal
        :is-open="showDeleteModal"
        title="Delete Project"
        message="Are you sure you want to delete this project? This action cannot be undone."
        @confirm="handleDelete"
        @close="showDeleteModal = false"
      />
    </div>
  </Layout>
</template>
