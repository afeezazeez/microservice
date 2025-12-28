<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useRolesStore } from '@/stores/roles'
import Layout from '@/components/Layout.vue'

const authStore = useAuthStore()
const rolesStore = useRolesStore()

const userRoles = computed(() => {
  const userRoleSlugs = authStore.user?.roles || []
  return rolesStore.roles.filter(role => userRoleSlugs.includes(role.slug))
})

const allPermissions = computed(() => {
  const permissionsSet = new Set<string>()
  userRoles.value.forEach(role => {
    role.permissions?.forEach(perm => {
      permissionsSet.add(perm.slug)
    })
  })
  return Array.from(permissionsSet).sort()
})

const groupedPermissions = computed(() => {
  const groups: Record<string, string[]> = {}
  allPermissions.value.forEach(perm => {
    const parts = perm.split(':')
    const resource = parts[0]
    if (resource) {
      if (!groups[resource]) {
        groups[resource] = []
      }
      groups[resource].push(perm)
    }
  })
  return groups
})

onMounted(() => {
  rolesStore.fetchRoles()
})
</script>

<template>
  <Layout>
    <div class="p-4 lg:p-6">
      <!-- Welcome Header -->
      <div class="mb-6 lg:mb-8">
        <h2 class="text-2xl lg:text-3xl font-bold text-white">
          Welcome, {{ authStore.user?.name?.split(' ')[0] }}! 👋
        </h2>
        <p class="text-zinc-400 mt-1 text-sm lg:text-base">Here's your account overview</p>
      </div>

      <!-- Stats Grid -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6 mb-6 lg:mb-8">
        <div class="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-2xl p-4 lg:p-6">
          <div class="flex items-center gap-4">
            <div class="w-12 h-12 rounded-xl bg-green-500/20 flex items-center justify-center">
              <svg class="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p class="text-sm text-zinc-400">Status</p>
              <p class="text-xl font-semibold text-white">Authenticated</p>
            </div>
          </div>
        </div>

        <div class="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-2xl p-4 lg:p-6">
          <div class="flex items-center gap-4">
            <div class="w-12 h-12 rounded-xl bg-indigo-500/20 flex items-center justify-center">
              <svg class="w-6 h-6 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <div>
              <p class="text-sm text-zinc-400">Company</p>
              <p class="text-xl font-semibold text-white">{{ authStore.user?.company_name || 'N/A' }}</p>
            </div>
          </div>
        </div>

        <div class="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-2xl p-4 lg:p-6">
          <div class="flex items-center gap-4">
            <div class="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center">
              <svg class="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <div>
              <p class="text-sm text-zinc-400">Roles</p>
              <p class="text-xl font-semibold text-white">
                {{ authStore.user?.roles?.length ? authStore.user.roles.join(', ') : 'No roles' }}
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- User Info Card -->
      <div class="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-2xl overflow-hidden">
        <div class="px-4 lg:px-6 py-4 border-b border-[var(--color-border)]">
          <h3 class="text-base lg:text-lg font-semibold text-white">Account Details</h3>
        </div>
        <div class="p-4 lg:p-6">
          <dl class="grid grid-cols-1 sm:grid-cols-2 gap-4 lg:gap-6">
            <div>
              <dt class="text-sm font-medium text-zinc-400">Full Name</dt>
              <dd class="mt-1 text-white font-mono text-sm bg-[var(--color-bg-elevated)] px-3 py-2 rounded-lg">
                {{ authStore.fullName }}
              </dd>
            </div>
            <div>
              <dt class="text-sm font-medium text-zinc-400">Email</dt>
              <dd class="mt-1 text-white font-mono text-sm bg-[var(--color-bg-elevated)] px-3 py-2 rounded-lg">
                {{ authStore.user?.email }}
              </dd>
            </div>
          </dl>
        </div>
      </div>

      <!-- Roles & Permissions Section -->
      <div class="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-2xl overflow-hidden mt-6 lg:mt-8">
        <div class="px-4 lg:px-6 py-3 border-b border-[var(--color-border)]">
          <h3 class="text-base font-semibold text-white">Roles & Permissions</h3>
        </div>
        <div class="p-4 lg:p-5">
          <!-- Roles -->
          <div class="mb-4">
            <h4 class="text-xs font-medium text-zinc-400 mb-2">Roles</h4>
            <div class="flex flex-wrap gap-2">
              <span
                v-for="role in userRoles"
                :key="role.id"
                class="inline-flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-indigo-500/20 to-purple-500/20 border border-indigo-500/30 rounded-lg text-sm text-white"
              >
                <svg class="w-4 h-4 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                {{ role.name }}
              </span>
              <span v-if="userRoles.length === 0" class="text-xs text-zinc-500 italic">No roles</span>
            </div>
          </div>

          <!-- Permissions -->
          <div>
            <h4 class="text-xs font-medium text-zinc-400 mb-2">Permissions</h4>
            <div class="space-y-2">
              <div
                v-for="(perms, resource) in groupedPermissions"
                :key="resource"
                class="flex flex-wrap items-center gap-1.5"
              >
                <span class="text-xs font-medium text-purple-400 capitalize mr-1">{{ resource }}:</span>
                <span
                  v-for="perm in perms"
                  :key="perm"
                  class="inline-flex items-center gap-1 px-2 py-1 bg-[var(--color-bg-elevated)] border border-[var(--color-border)] rounded text-xs text-zinc-300 font-mono"
                >
                  <svg class="w-3 h-3 text-green-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                  </svg>
                  {{ perm.split(':')[1] }}
                </span>
              </div>
              <span v-if="allPermissions.length === 0" class="text-xs text-zinc-500 italic">No permissions</span>
            </div>
          </div>
        </div>
      </div>
  </div>
  </Layout>
</template>
