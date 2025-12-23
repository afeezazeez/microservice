<script setup lang="ts">
import { Toaster } from 'vue-sonner'
</script>

<template>
  <Toaster 
    position="top-right" 
    :theme="'dark'"
    :toastOptions="{
      style: {
        background: 'var(--color-bg-card)',
        border: '1px solid var(--color-border)',
        color: 'var(--color-text)',
      },
    }"
    richColors
    closeButton
  />
  <RouterView />
</template>
