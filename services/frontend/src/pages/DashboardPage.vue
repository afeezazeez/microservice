<script setup lang="ts">
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()

function handleLogout() {
  authStore.logout()
}
</script>

<template>
  <div class="min-h-screen bg-[var(--color-bg)]">
    <!-- Top Navigation -->
    <nav class="border-b border-[var(--color-border)] bg-[var(--color-bg-elevated)]">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex items-center justify-between h-16">
          <!-- Logo -->
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
              <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <span class="text-lg font-semibold text-white">TaskFlow</span>
          </div>

          <!-- User menu -->
          <div class="flex items-center gap-4">
            <div class="text-right hidden sm:block">
              <p class="text-sm font-medium text-white">{{ authStore.fullName }}</p>
              <p class="text-xs text-zinc-400">{{ authStore.user?.email }}</p>
            </div>
            <div class="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-semibold">
              {{ authStore.user?.name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() }}
            </div>
            <button
              @click="handleLogout"
              :disabled="authStore.loading"
              class="px-4 py-2 text-sm font-medium text-zinc-400 hover:text-white border border-[var(--color-border)] hover:border-red-500/50 hover:bg-red-500/10 rounded-lg transition-all"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </nav>

    <!-- Main Content -->
    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <!-- Welcome Header -->
      <div class="mb-8">
        <h1 class="text-3xl font-bold text-white">
          Welcome, {{ authStore.user?.name?.split(' ')[0] }}! 👋
        </h1>
        <p class="text-zinc-400 mt-1">Here's your account overview</p>
      </div>

      <!-- Stats Grid -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div class="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-2xl p-6">
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

        <div class="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-2xl p-6">
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

        <div class="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-2xl p-6">
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
        <div class="px-6 py-4 border-b border-[var(--color-border)]">
          <h2 class="text-lg font-semibold text-white">Account Details</h2>
        </div>
        <div class="p-6">
          <dl class="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <dt class="text-sm font-medium text-zinc-400">User ID</dt>
              <dd class="mt-1 text-white font-mono text-sm bg-[var(--color-bg-elevated)] px-3 py-2 rounded-lg">
                {{ authStore.user?.id }}
              </dd>
            </div>
            <div>
              <dt class="text-sm font-medium text-zinc-400">Company ID</dt>
              <dd class="mt-1 text-white font-mono text-sm bg-[var(--color-bg-elevated)] px-3 py-2 rounded-lg">
                {{ authStore.user?.company_id }}
              </dd>
            </div>
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

      <!-- Integration Info -->
      <div class="mt-8 p-6 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border border-indigo-500/20 rounded-2xl">
        <div class="flex items-start gap-4">
          <div class="w-10 h-10 rounded-lg bg-indigo-500/20 flex items-center justify-center flex-shrink-0">
            <svg class="w-5 h-5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div class="flex-1">
            <h3 class="text-white font-semibold">Full Stack Integration Test</h3>
            <p class="text-zinc-400 text-sm mt-1">
              This dashboard confirms the complete flow is working:
            </p>
            <ul class="text-zinc-400 text-sm mt-2 space-y-1">
              <li class="flex items-center gap-2">
                <span class="w-1.5 h-1.5 rounded-full bg-green-400"></span>
                Frontend (Vue 3 + TypeScript + Tailwind)
              </li>
              <li class="flex items-center gap-2">
                <span class="w-1.5 h-1.5 rounded-full bg-green-400"></span>
                API Gateway (Node.js + Express) — proxies requests
              </li>
              <li class="flex items-center gap-2">
                <span class="w-1.5 h-1.5 rounded-full bg-green-400"></span>
                IAM Service (Laravel 12) — handles authentication
              </li>
            </ul>
            <div class="mt-4 pt-4 border-t border-indigo-500/20">
              <p class="text-zinc-400 text-sm mb-2">API Documentation:</p>
              <a
                href="https://project-service.afeez-dev.local/api/docs"
                target="_blank"
                rel="noopener noreferrer"
                class="inline-flex items-center gap-2 text-indigo-400 hover:text-indigo-300 text-sm font-medium transition-colors"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
                Project Service API Docs
                <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            </div>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

