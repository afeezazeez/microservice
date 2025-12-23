import type { ToastInterface } from 'vue-toastification'

let toast: ToastInterface

export function setToast(t: ToastInterface) {
  toast = t
}

export function showSuccess(message: string) {
  toast?.success(message)
}

export function showError(message: string) {
  toast?.error(message)
}

export function showInfo(message: string) {
  toast?.info(message)
}

