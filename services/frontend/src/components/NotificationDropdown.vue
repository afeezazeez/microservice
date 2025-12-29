<script setup lang="ts">
import { ref, computed, onMounted, watch, onUnmounted } from 'vue'
import { useNotificationsStore } from '@/stores/notifications'
import { formatDistanceToNow } from 'date-fns'

defineOptions({
  inheritAttrs: false
})

const notificationsStore = useNotificationsStore()
const activeTab = ref<'unread' | 'all'>('unread')
const isOpen = defineModel<boolean>({ default: false })

const displayedNotifications = computed(() => {
  if (activeTab.value === 'unread') {
    return notificationsStore.notifications.filter(n => !n.read_at)
  }
  return notificationsStore.notifications
})

function formatTime(dateString: string): string {
  try {
    return formatDistanceToNow(new Date(dateString), { addSuffix: true })
  } catch {
    return 'Recently'
  }
}

async function handleTabChange(tab: 'unread' | 'all') {
  activeTab.value = tab
  await notificationsStore.fetchNotifications(tab)
}

async function handleMarkAsRead(notificationId: number) {
  await notificationsStore.markAsRead(notificationId)
}

function handleClickOutside(event: MouseEvent) {
  const target = event.target as HTMLElement
  if (!target.closest('.notification-dropdown') && !target.closest('.notification-icon-button')) {
    isOpen.value = false
  }
}

onMounted(async () => {
  await notificationsStore.fetchNotifications('unread')
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})

watch(isOpen, (newValue) => {
  if (newValue) {
    notificationsStore.fetchNotifications(activeTab.value)
  }
})
</script>

<template>
  <Teleport to="body">
    <div v-if="isOpen" class="notification-dropdown fixed right-4 top-16 z-50 w-96 bg-[var(--color-bg-elevated)] border border-[var(--color-border)] rounded-lg shadow-xl max-h-[600px] flex flex-col">
    <div class="p-4 border-b border-[var(--color-border)]">
      <div class="flex items-center justify-between mb-3">
        <h3 class="text-lg font-semibold text-white">Notifications</h3>
        <button
          @click="isOpen = false"
          class="p-1 text-zinc-400 hover:text-white rounded transition-colors cursor-pointer"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      <div class="flex gap-2 border-b border-[var(--color-border)] -mb-4">
        <button
          @click="handleTabChange('unread')"
          :class="[
            'px-4 py-2 text-sm font-medium transition-colors cursor-pointer border-b-2',
            activeTab === 'unread'
              ? 'text-indigo-400 border-indigo-400'
              : 'text-zinc-400 border-transparent hover:text-white'
          ]"
        >
          Unread
          <span v-if="notificationsStore.unreadCount > 0" class="ml-2 px-2 py-0.5 text-xs bg-red-500 text-white rounded-full">
            {{ notificationsStore.unreadCount }}
          </span>
        </button>
        <button
          @click="handleTabChange('all')"
          :class="[
            'px-4 py-2 text-sm font-medium transition-colors cursor-pointer border-b-2',
            activeTab === 'all'
              ? 'text-indigo-400 border-indigo-400'
              : 'text-zinc-400 border-transparent hover:text-white'
          ]"
        >
          All
        </button>
      </div>
    </div>
    <div class="flex-1 overflow-y-auto">
      <div v-if="notificationsStore.loading" class="p-8 text-center text-zinc-400">
        Loading...
      </div>
      <div v-else-if="displayedNotifications.length === 0" class="p-8 text-center text-zinc-400">
        <p>No {{ activeTab === 'unread' ? 'unread' : '' }} notifications</p>
      </div>
      <div v-else class="divide-y divide-[var(--color-border)]">
        <div
          v-for="notification in displayedNotifications"
          :key="notification.id"
          :class="[
            'p-4 hover:bg-[var(--color-bg)] transition-colors',
            !notification.read_at ? 'bg-indigo-500/5 border-l-2 border-indigo-500' : ''
          ]"
        >
          <div class="flex items-start justify-between gap-3">
            <div class="flex-1 min-w-0">
              <div class="flex items-start gap-2 mb-1">
                <h4 :class="['text-sm font-medium', !notification.read_at ? 'text-white' : 'text-zinc-300']">
                  {{ notification.title }}
                </h4>
                <span v-if="!notification.read_at" class="flex-shrink-0 w-2 h-2 bg-indigo-500 rounded-full mt-1.5"></span>
              </div>
              <p :class="['text-sm mb-2', !notification.read_at ? 'text-zinc-200' : 'text-zinc-400']">
                {{ notification.message }}
              </p>
              <p class="text-xs text-zinc-500">
                {{ formatTime(notification.created_at) }}
              </p>
            </div>
            <div class="flex items-center gap-2 flex-shrink-0">
              <button
                v-if="!notification.read_at"
                @click="handleMarkAsRead(notification.id)"
                class="p-1.5 text-indigo-400 hover:text-indigo-300 hover:bg-indigo-500/10 rounded transition-colors cursor-pointer"
                title="Mark as read"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                </svg>
              </button>
              <button
                @click="notificationsStore.deleteNotification(notification.id)"
                class="p-1.5 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors cursor-pointer"
                title="Delete"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
    </div>
  </Teleport>
</template>

