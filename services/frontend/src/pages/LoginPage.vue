<script setup lang="ts">
import { ref, computed } from 'vue'
import { RouterLink } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()

const form = ref({
  email: '',
  password: '',
})

const errors = ref<Record<string, string>>({})

const isValid = computed(() => {
  return form.value.email.includes('@') && form.value.password.length >= 6
})

async function handleSubmit() {
  errors.value = {}
  
  if (!form.value.email) {
    errors.value.email = 'Email is required'
    return
  }
  if (!form.value.password) {
    errors.value.password = 'Password is required'
    return
  }

  await authStore.login({
    email: form.value.email,
    password: form.value.password,
  })
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center px-4 relative overflow-hidden">
    <!-- Background decoration -->
    <div class="absolute inset-0 -z-10">
      <div class="absolute top-1/4 -left-1/4 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl"></div>
      <div class="absolute bottom-1/4 -right-1/4 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl"></div>
    </div>

    <div class="w-full max-w-md">
      <!-- Logo / Brand -->
      <div class="text-center mb-8">
        <div class="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 mb-4">
          <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>
        <h1 class="text-2xl font-bold text-white">Welcome back</h1>
        <p class="text-zinc-400 mt-1">Sign in to your account</p>
      </div>

      <!-- Form Card -->
      <div class="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-2xl p-8 shadow-2xl shadow-black/20">
        <form @submit.prevent="handleSubmit" class="space-y-5">
          <!-- Email -->
          <div>
            <label for="email" class="block text-sm font-medium text-zinc-300 mb-2">
              Email address
            </label>
            <input
              id="email"
              v-model="form.email"
              type="email"
              autocomplete="email"
              required
              class="w-full px-4 py-3 bg-[var(--color-bg-elevated)] border border-[var(--color-border)] rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
              placeholder="you@company.com"
              :class="{ 'border-red-500 focus:ring-red-500': errors.email }"
            />
            <p v-if="errors.email" class="mt-1 text-sm text-red-400">{{ errors.email }}</p>
          </div>

          <!-- Password -->
          <div>
            <label for="password" class="block text-sm font-medium text-zinc-300 mb-2">
              Password
            </label>
            <input
              id="password"
              v-model="form.password"
              type="password"
              autocomplete="current-password"
              required
              class="w-full px-4 py-3 bg-[var(--color-bg-elevated)] border border-[var(--color-border)] rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
              placeholder="••••••••"
              :class="{ 'border-red-500 focus:ring-red-500': errors.password }"
            />
            <p v-if="errors.password" class="mt-1 text-sm text-red-400">{{ errors.password }}</p>
          </div>

          <!-- Submit -->
          <button
            type="submit"
            :disabled="authStore.loading || !isValid"
            class="w-full py-3 px-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <svg v-if="authStore.loading" class="animate-spin h-5 w-5" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none" />
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <span>{{ authStore.loading ? 'Signing in...' : 'Sign in' }}</span>
          </button>
        </form>

        <!-- Divider -->
        <div class="relative my-6">
          <div class="absolute inset-0 flex items-center">
            <div class="w-full border-t border-[var(--color-border)]"></div>
          </div>
          <div class="relative flex justify-center text-sm">
            <span class="px-2 bg-[var(--color-bg-card)] text-zinc-500">New to platform?</span>
          </div>
        </div>

        <!-- Register link -->
        <RouterLink
          to="/register"
          class="block w-full py-3 px-4 bg-transparent border border-[var(--color-border)] hover:border-indigo-500 text-zinc-300 hover:text-white font-medium rounded-xl transition-all duration-200 text-center"
        >
          Create an account
        </RouterLink>
      </div>

      <!-- Footer -->
      <p class="text-center text-zinc-500 text-sm mt-6">
        Microservices Demo · IAM + API Gateway
      </p>
    </div>
  </div>
</template>

