<script setup lang="ts">
import { RouterLink } from 'vue-router'
</script>

<template>
  <div class="min-h-screen flex items-center justify-center px-4">
    <div class="text-center">
      <h1 class="text-9xl font-bold text-indigo-500">404</h1>
      <p class="text-2xl font-semibold text-white mt-4">Page not found</p>
      <p class="text-zinc-400 mt-2">The page you're looking for doesn't exist.</p>
      <RouterLink
        to="/"
        class="inline-block mt-8 px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-xl transition-colors"
      >
        Go back home
      </RouterLink>
    </div>
  </div>
</template>

