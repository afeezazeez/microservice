<script setup lang="ts">
import Modal from './Modal.vue'

interface Props {
  isOpen: boolean
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  variant?: 'danger' | 'primary'
}

const props = withDefaults(defineProps<Props>(), {
  confirmText: 'Confirm',
  cancelText: 'Cancel',
  variant: 'danger',
})

const emit = defineEmits<{
  confirm: []
  close: []
}>()

function handleConfirm() {
  emit('confirm')
}

function handleClose() {
  emit('close')
}

const confirmButtonClasses = props.variant === 'danger'
  ? 'bg-red-600 hover:bg-red-700'
  : 'bg-indigo-600 hover:bg-indigo-700'
</script>

<template>
  <Modal :is-open="isOpen" :title="title" @close="handleClose">
    <div class="space-y-4">
      <p class="text-zinc-400">{{ message }}</p>
      <div class="flex gap-3 pt-4">
        <button
          type="button"
          @click="handleClose"
          class="flex-1 px-4 py-2 border border-[var(--color-border)] text-zinc-400 hover:text-white rounded-lg transition-colors cursor-pointer"
        >
          {{ cancelText }}
        </button>
        <button
          type="button"
          @click="handleConfirm"
          :class="[
            'flex-1 px-4 py-2 text-white rounded-lg font-medium transition-colors cursor-pointer',
            confirmButtonClasses,
          ]"
        >
          {{ confirmText }}
        </button>
      </div>
    </div>
  </Modal>
</template>

