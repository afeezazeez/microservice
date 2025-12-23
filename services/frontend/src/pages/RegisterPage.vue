<script setup lang="ts">
import { ref, computed } from 'vue'
import { RouterLink } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()

const form = ref({
  companyName: '',
  companyEmail: '',
  userName: '',
  userEmail: '',
  password: '',
  passwordConfirmation: '',
})

const errors = ref<Record<string, string>>({})

const isValid = computed(() => {
  return (
    form.value.companyName.length >= 2 &&
    form.value.companyEmail.includes('@') &&
    form.value.userName.length >= 2 &&
    form.value.userEmail.includes('@') &&
    form.value.password.length >= 8 &&
    form.value.password === form.value.passwordConfirmation
  )
})

const passwordsMatch = computed(() => {
  return form.value.password === form.value.passwordConfirmation || form.value.passwordConfirmation === ''
})

async function handleSubmit() {
  errors.value = {}

  // Client-side validation
  if (!form.value.companyName) errors.value.companyName = 'Company name is required'
  if (!form.value.companyEmail) errors.value.companyEmail = 'Company email is required'
  if (!form.value.userName) errors.value.userName = 'Your name is required'
  if (!form.value.userEmail) errors.value.userEmail = 'Email is required'
  if (form.value.password.length < 8) errors.value.password = 'Password must be at least 8 characters'
  if (form.value.password !== form.value.passwordConfirmation) {
    errors.value.passwordConfirmation = 'Passwords do not match'
  }

  if (Object.keys(errors.value).length > 0) return

  const result = await authStore.register({
    company: {
      name: form.value.companyName,
      email: form.value.companyEmail,
    },
    user: {
      name: form.value.userName,
      email: form.value.userEmail,
      password: form.value.password,
      password_confirmation: form.value.passwordConfirmation,
    },
  })

  // Handle server-side validation errors
  if (!result.success && result.errors) {
    for (const [key, messages] of Object.entries(result.errors)) {
      const fieldMap: Record<string, string> = {
        'company.name': 'companyName',
        'company.email': 'companyEmail',
        'user.name': 'userName',
        'user.email': 'userEmail',
        'user.password': 'password',
      }
      const fieldName = fieldMap[key] || key
      const msgArray = messages as string[]
      const firstMsg = msgArray[0]
      if (firstMsg) {
        errors.value[fieldName] = firstMsg
      }
    }
  }
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center px-4 py-12 relative overflow-hidden">
    <!-- Background decoration -->
    <div class="absolute inset-0 -z-10">
      <div class="absolute top-1/3 -right-1/4 w-[500px] h-[500px] bg-purple-600/15 rounded-full blur-3xl"></div>
      <div class="absolute bottom-1/3 -left-1/4 w-[500px] h-[500px] bg-indigo-600/15 rounded-full blur-3xl"></div>
    </div>

    <div class="w-full max-w-lg">
      <!-- Logo / Brand -->
      <div class="text-center mb-8">
        <div class="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 mb-4">
          <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
        </div>
        <h1 class="text-2xl font-bold text-white">Create your workspace</h1>
        <p class="text-zinc-400 mt-1">Set up your company and admin account</p>
      </div>

      <!-- Form Card -->
      <div class="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-2xl p-8 shadow-2xl shadow-black/20">
        <form @submit.prevent="handleSubmit" class="space-y-5">
          <!-- Company Section -->
          <div class="space-y-4">
            <h3 class="text-sm font-semibold text-zinc-400 uppercase tracking-wider">Company Details</h3>
            
            <!-- Company Name -->
            <div>
              <label for="companyName" class="block text-sm font-medium text-zinc-300 mb-2">
                Company name
              </label>
              <input
                id="companyName"
                v-model="form.companyName"
                type="text"
                required
                class="w-full px-4 py-3 bg-[var(--color-bg-elevated)] border border-[var(--color-border)] rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                placeholder="Acme Inc."
                :class="{ 'border-red-500 focus:ring-red-500': errors.companyName }"
              />
              <p v-if="errors.companyName" class="mt-1 text-sm text-red-400">{{ errors.companyName }}</p>
            </div>

            <!-- Company Email -->
            <div>
              <label for="companyEmail" class="block text-sm font-medium text-zinc-300 mb-2">
                Company email
              </label>
              <input
                id="companyEmail"
                v-model="form.companyEmail"
                type="email"
                required
                class="w-full px-4 py-3 bg-[var(--color-bg-elevated)] border border-[var(--color-border)] rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                placeholder="contact@acme.com"
                :class="{ 'border-red-500 focus:ring-red-500': errors.companyEmail }"
              />
              <p v-if="errors.companyEmail" class="mt-1 text-sm text-red-400">{{ errors.companyEmail }}</p>
            </div>
          </div>

          <!-- Divider -->
          <div class="border-t border-[var(--color-border)]"></div>

          <!-- Admin User Section -->
          <div class="space-y-4">
            <h3 class="text-sm font-semibold text-zinc-400 uppercase tracking-wider">Admin Account</h3>

            <!-- User Name -->
            <div>
              <label for="userName" class="block text-sm font-medium text-zinc-300 mb-2">
                Your name
              </label>
              <input
                id="userName"
                v-model="form.userName"
                type="text"
                required
                class="w-full px-4 py-3 bg-[var(--color-bg-elevated)] border border-[var(--color-border)] rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                placeholder="John Doe"
                :class="{ 'border-red-500 focus:ring-red-500': errors.userName }"
              />
              <p v-if="errors.userName" class="mt-1 text-sm text-red-400">{{ errors.userName }}</p>
            </div>

            <!-- User Email -->
            <div>
              <label for="userEmail" class="block text-sm font-medium text-zinc-300 mb-2">
                Your email
              </label>
              <input
                id="userEmail"
                v-model="form.userEmail"
                type="email"
                autocomplete="email"
                required
                class="w-full px-4 py-3 bg-[var(--color-bg-elevated)] border border-[var(--color-border)] rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                placeholder="john@acme.com"
                :class="{ 'border-red-500 focus:ring-red-500': errors.userEmail }"
              />
              <p v-if="errors.userEmail" class="mt-1 text-sm text-red-400">{{ errors.userEmail }}</p>
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
                autocomplete="new-password"
                required
                class="w-full px-4 py-3 bg-[var(--color-bg-elevated)] border border-[var(--color-border)] rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                placeholder="Min 8 characters"
                :class="{ 'border-red-500 focus:ring-red-500': errors.password }"
              />
              <p v-if="errors.password" class="mt-1 text-sm text-red-400">{{ errors.password }}</p>
            </div>

            <!-- Confirm Password -->
            <div>
              <label for="passwordConfirmation" class="block text-sm font-medium text-zinc-300 mb-2">
                Confirm password
              </label>
              <input
                id="passwordConfirmation"
                v-model="form.passwordConfirmation"
                type="password"
                autocomplete="new-password"
                required
                class="w-full px-4 py-3 bg-[var(--color-bg-elevated)] border border-[var(--color-border)] rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                placeholder="Repeat password"
                :class="{ 'border-red-500 focus:ring-red-500': !passwordsMatch || errors.passwordConfirmation }"
              />
              <p v-if="!passwordsMatch" class="mt-1 text-sm text-red-400">Passwords do not match</p>
              <p v-else-if="errors.passwordConfirmation" class="mt-1 text-sm text-red-400">{{ errors.passwordConfirmation }}</p>
            </div>
          </div>

          <!-- Submit -->
          <button
            type="submit"
            :disabled="authStore.loading || !isValid"
            class="w-full py-3 px-4 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <svg v-if="authStore.loading" class="animate-spin h-5 w-5" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none" />
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <span>{{ authStore.loading ? 'Creating account...' : 'Create account' }}</span>
          </button>
        </form>

        <!-- Divider -->
        <div class="relative my-6">
          <div class="absolute inset-0 flex items-center">
            <div class="w-full border-t border-[var(--color-border)]"></div>
          </div>
          <div class="relative flex justify-center text-sm">
            <span class="px-2 bg-[var(--color-bg-card)] text-zinc-500">Already have an account?</span>
          </div>
        </div>

        <!-- Login link -->
        <RouterLink
          to="/login"
          class="block w-full py-3 px-4 bg-transparent border border-[var(--color-border)] hover:border-indigo-500 text-zinc-300 hover:text-white font-medium rounded-xl transition-all duration-200 text-center"
        >
          Sign in instead
        </RouterLink>
      </div>

      <!-- Footer -->
      <p class="text-center text-zinc-500 text-sm mt-6">
        Microservices Demo · IAM + API Gateway
      </p>
    </div>
  </div>
</template>
