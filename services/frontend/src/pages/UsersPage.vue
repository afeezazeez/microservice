<script setup lang="ts">
import { ref, onMounted } from 'vue'
import Layout from '@/components/Layout.vue'
import Modal from '@/components/Modal.vue'
import ConfirmModal from '@/components/ConfirmModal.vue'
import { useUsersStore } from '@/stores/users'
import { useAuthStore } from '@/stores/auth'
import { useRolesStore } from '@/stores/roles'
import type { User } from '@/types/auth'
import type { InviteUserPayload } from '@/types/auth/users'

const usersStore = useUsersStore()
const authStore = useAuthStore()
const rolesStore = useRolesStore()

const showInviteModal = ref(false)
const showEditModal = ref(false)
const showDeleteModal = ref(false)
const selectedUser = ref<User | null>(null)
const userToDelete = ref<number | null>(null)

const inviteForm = ref({
  name: '',
  email: '',
  role_slug: '',
})

const editForm = ref({
  name: '',
  email: '',
})

async function handleInvite() {
  const payload: InviteUserPayload = {
    name: inviteForm.value.name,
    email: inviteForm.value.email,
    role_slug: inviteForm.value.role_slug,
  }

  const result = await usersStore.inviteUser(payload)
  if (result.success) {
    showInviteModal.value = false
    inviteForm.value = { name: '', email: '', role_slug: '' }
  }
}

function openEditModal(user: User) {
  selectedUser.value = user
  editForm.value = {
    name: user.name,
    email: user.email,
  }
  showEditModal.value = true
}

async function handleUpdate() {
  if (!selectedUser.value) return

  const result = await usersStore.updateUser(selectedUser.value.id, { name: editForm.value.name })
  if (result.success) {
    showEditModal.value = false
    selectedUser.value = null
  }
}

function openDeleteModal(userId: number) {
  userToDelete.value = userId
  showDeleteModal.value = true
}

async function handleDelete() {
  if (userToDelete.value === null) return
  await usersStore.deleteUser(userToDelete.value)
  showDeleteModal.value = false
  userToDelete.value = null
}

onMounted(() => {
  usersStore.fetchUsers()
  rolesStore.fetchRoles()
})
</script>

<template>
  <Layout>
    <div class="p-4 lg:p-6">
      <!-- Header -->
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h2 class="text-xl lg:text-2xl font-semibold text-white">Users</h2>
          <p class="text-zinc-400 mt-1 text-sm lg:text-base">Manage users in your company</p>
        </div>
        <button
          @click="showInviteModal = true"
          class="w-full sm:w-auto px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors cursor-pointer"
        >
          Invite User
        </button>
      </div>

      <!-- Users Table -->
      <div class="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-2xl overflow-hidden">
        <div v-if="usersStore.loading" class="p-8 text-center">
          <p class="text-zinc-400">Loading users...</p>
        </div>
        <div v-else-if="usersStore.users.length === 0" class="p-8 text-center">
          <p class="text-zinc-400">No users found</p>
        </div>
        <!-- Desktop Table -->
        <div class="hidden lg:block overflow-x-auto">
          <table class="w-full">
            <thead class="bg-[var(--color-bg-elevated)] border-b border-[var(--color-border)]">
              <tr>
                <th class="px-6 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">Name</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">Email</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">Roles</th>
                <th class="px-6 py-3 text-right text-xs font-medium text-zinc-400 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-[var(--color-border)]">
              <tr v-for="user in usersStore.users" :key="user.id" class="hover:bg-[var(--color-bg-elevated)]">
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="text-sm font-medium text-white">{{ user.name }}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="text-sm text-zinc-400">{{ user.email }}</div>
                </td>
                <td class="px-6 py-4">
                  <div class="text-sm text-zinc-400">
                    <template v-if="user.roles && user.roles.length > 0">
                      <div class="flex flex-wrap gap-1">
                        <span
                          v-for="role in user.roles"
                          :key="role"
                          class="inline-flex items-center px-2 py-1 rounded-md bg-indigo-500/20 text-indigo-400 text-xs font-medium"
                        >
                          {{ role }}
                        </span>
                      </div>
                    </template>
                    <span v-else class="text-zinc-500">No roles</span>
                  </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button
                    @click="openEditModal(user)"
                    class="text-indigo-400 hover:text-indigo-300 mr-4 cursor-pointer"
                  >
                    Edit
                  </button>
                  <button
                    v-if="user.id !== authStore.user?.id"
                    @click="openDeleteModal(user.id)"
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
            v-for="user in usersStore.users"
            :key="user.id"
            class="p-4 hover:bg-[var(--color-bg-elevated)]"
          >
            <div class="flex items-start justify-between mb-3">
              <div class="flex-1 min-w-0">
                <div class="text-base font-medium text-white truncate">{{ user.name }}</div>
                <div class="text-sm text-zinc-400 truncate mt-1">{{ user.email }}</div>
              </div>
              <div class="flex gap-2 ml-4">
                <button
                  @click="openEditModal(user)"
                  class="text-indigo-400 hover:text-indigo-300 cursor-pointer"
                  aria-label="Edit user"
                >
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
                <button
                  v-if="user.id !== authStore.user?.id"
                  @click="openDeleteModal(user.id)"
                  class="text-red-400 hover:text-red-300 cursor-pointer"
                  aria-label="Delete user"
                >
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
            <div class="mt-3">
              <div class="text-xs text-zinc-400 mb-1">Roles</div>
              <div class="text-sm text-zinc-400">
                <template v-if="user.roles && user.roles.length > 0">
                  <div class="flex flex-wrap gap-1">
                    <span
                      v-for="role in user.roles"
                      :key="role"
                      class="inline-flex items-center px-2 py-1 rounded-md bg-indigo-500/20 text-indigo-400 text-xs font-medium"
                    >
                      {{ role }}
                    </span>
                  </div>
                </template>
                <span v-else class="text-zinc-500">No roles</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Invite Modal -->
      <Modal :is-open="showInviteModal" title="Invite User" @close="showInviteModal = false">
        <form @submit.prevent="handleInvite" class="space-y-4">
          <div>
            <label for="invite-name" class="block text-sm font-medium text-zinc-400 mb-2">Name</label>
            <input
              id="invite-name"
              v-model="inviteForm.name"
              type="text"
              required
              class="w-full px-4 py-2 bg-[var(--color-bg-elevated)] border border-[var(--color-border)] rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label for="invite-email" class="block text-sm font-medium text-zinc-400 mb-2">Email</label>
            <input
              id="invite-email"
              v-model="inviteForm.email"
              type="email"
              required
              class="w-full px-4 py-2 bg-[var(--color-bg-elevated)] border border-[var(--color-border)] rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label for="invite-role" class="block text-sm font-medium text-zinc-400 mb-2">Role</label>
            <select
              id="invite-role"
              v-model="inviteForm.role_slug"
              required
              class="w-full px-4 py-2 bg-[var(--color-bg-elevated)] border border-[var(--color-border)] rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
            >
              <option value="">Select a role</option>
              <option
                v-for="role in rolesStore.roles"
                :key="role.id"
                :value="role.slug"
              >
                {{ role.name }}
              </option>
            </select>
          </div>
          <div class="flex gap-3 pt-4">
            <button
              type="button"
              @click="showInviteModal = false"
              class="flex-1 px-4 py-2 border border-[var(--color-border)] text-zinc-400 hover:text-white rounded-lg transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              class="flex-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors cursor-pointer"
            >
              Invite
            </button>
          </div>
        </form>
      </Modal>

      <!-- Edit Modal -->
      <Modal :is-open="showEditModal" title="Edit User" @close="showEditModal = false">
        <form @submit.prevent="handleUpdate" class="space-y-4">
          <div>
            <label for="edit-name" class="block text-sm font-medium text-zinc-400 mb-2">Name</label>
            <input
              id="edit-name"
              v-model="editForm.name"
              type="text"
              required
              class="w-full px-4 py-2 bg-[var(--color-bg-elevated)] border border-[var(--color-border)] rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label for="edit-email" class="block text-sm font-medium text-zinc-400 mb-2">Email</label>
            <input
              id="edit-email"
              v-model="editForm.email"
              type="email"
              required
              readonly
              class="w-full px-4 py-2 bg-[var(--color-bg-elevated)] border border-[var(--color-border)] rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-not-allowed"
            />
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

     <ConfirmModal
        :is-open="showDeleteModal"
        title="Delete User"
        message="Are you sure you want to delete this user? This action cannot be undone."
        confirm-text="Delete"
        cancel-text="Cancel"
        variant="danger"
        @confirm="handleDelete"
        @close="showDeleteModal = false"
      />
    </div>
  </Layout>
</template>

