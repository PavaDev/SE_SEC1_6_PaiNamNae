<template>
    <div class="fixed z-50 bottom-6 right-6 font-sans" :class="{ 'bottom-admin': isAdminPage }">
        <!-- Floating Button -->
        <button
            @click="toggleChat"
            aria-label="Toggle Notifications"
            class="relative flex items-center justify-center w-14 h-14 rounded-full shadow-2xl transition-all duration-300 hover:scale-110 active:scale-95"
            :class="isOpen
                ? 'bg-gray-800'
                : 'bg-gradient-to-br from-indigo-600 via-blue-600 to-cyan-500'"
        >
            <span v-if="hasUnread && !isOpen" class="absolute inset-0 rounded-full animate-ping bg-blue-400 opacity-25"></span>
            <i v-if="!isOpen" class="fa-solid fa-bell text-white text-xl relative z-10"></i>
            <i v-else class="fa-solid fa-xmark text-white text-lg relative z-10"></i>

            <!-- Unread badge -->
            <div v-if="hasUnread && !isOpen"
                class="absolute -top-0.5 -right-0.5 w-5 h-5 bg-red-500 border-2 border-white rounded-full flex items-center justify-center">
                <span class="sr-only">มีการแจ้งเตือนใหม่</span>
            </div>
        </button>

        <!-- Notification Panel -->
        <transition name="notif-pop">
            <div v-if="isOpen"
                class="absolute bottom-16 right-0 w-[92vw] sm:w-[380px] h-[520px] max-h-[78vh] bg-white rounded-2xl shadow-2xl flex flex-col border border-gray-100 overflow-hidden"
            >
                <!-- Header -->
                <div class="flex-shrink-0 px-4 py-3.5 bg-gradient-to-r from-indigo-600 via-blue-600 to-cyan-500 flex items-center justify-between">
                    <div class="flex items-center gap-3">
                        <div class="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center">
                            <i class="fa-solid fa-bell text-white text-base"></i>
                        </div>
                        <div>
                            <h3 class="text-white font-bold text-sm leading-tight">การแจ้งเตือน</h3>
                            <div class="flex items-center gap-1.5 mt-0.5">
                                <span class="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></span>
                                <p class="text-blue-100 text-[10px] font-semibold uppercase tracking-wider">Live Updates</p>
                            </div>
                        </div>
                    </div>
                    <button @click="toggleChat"
                        class="w-7 h-7 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors">
                        <i class="fa-solid fa-xmark text-xs"></i>
                    </button>
                </div>

                <!-- Notifications List -->
                <div ref="messageArea" class="flex-1 overflow-y-auto px-4 py-3 space-y-2.5 bg-gray-50/50 scroll-smooth">
                    <!-- Empty state -->
                    <div v-if="notifications.length === 0"
                        class="flex flex-col items-center justify-center h-full text-center opacity-50 select-none">
                        <div class="w-14 h-14 bg-indigo-50 rounded-full flex items-center justify-center mb-3 text-indigo-400">
                            <i class="fa-solid fa-bell-slash text-2xl"></i>
                        </div>
                        <p class="text-sm text-gray-500 font-medium">ไม่มีการแจ้งเตือน</p>
                        <p class="text-xs text-gray-400 mt-1">การอัปเดตการเดินทางจะปรากฏที่นี่</p>
                    </div>

                    <div v-for="notif in notifications" :key="notif.id"
                        @click="handleClick(notif)"
                        class="flex items-start gap-3 p-3 rounded-xl border bg-white transition-all duration-200"
                        :class="notif.isClickable
                            ? 'cursor-pointer hover:border-blue-200 hover:shadow-sm hover:scale-[1.01] active:scale-[0.99]'
                            : 'border-gray-100'"
                    >
                        <!-- Icon -->
                        <div class="w-8 h-8 rounded-xl flex-shrink-0 flex items-center justify-center text-sm border"
                            :class="iconClass(notif.type)">
                            <i :class="iconName(notif.type)"></i>
                        </div>
                        <!-- Content -->
                        <div class="flex-1 min-w-0">
                            <p class="text-sm text-gray-800 font-semibold leading-snug whitespace-pre-wrap"
                                :class="notif.isClickable ? 'text-blue-700' : ''">
                                {{ notif.text }}
                            </p>
                            <p class="text-[10px] text-gray-400 mt-1 flex items-center gap-1">
                                <i class="fa-regular fa-clock text-[9px]"></i>{{ notif.time }}
                            </p>
                        </div>
                        <i v-if="notif.isClickable" class="fa-solid fa-chevron-right text-[10px] text-gray-300 mt-1 flex-shrink-0"></i>
                    </div>
                </div>

                <!-- Footer -->
                <div class="flex-shrink-0 px-4 py-3 border-t border-gray-100 bg-white">
                    <p class="text-[10px] text-center text-gray-400 italic">
                        การแจ้งเตือนเกี่ยวกับการเดินทางของคุณเท่านั้น
                    </p>
                </div>
            </div>
        </transition>
    </div>
</template>

<script setup>
import { ref, computed, nextTick, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useNotifications } from '~/composables/useNotifications'

const route = useRoute()
const { notifications, hasUnread, clearUnread, init, isOpen } = useNotifications()
const messageArea = ref(null)

const isAdminPage = computed(() => route.path.startsWith('/admin'))

// --- Helpers ---
const iconClass = (type) => {
    if (type === 'arrival') return 'bg-emerald-50 text-emerald-600 border-emerald-100'
    if (type === 'danger') return 'bg-red-50 text-red-500 border-red-100'
    if (type === 'status') return 'bg-blue-50 text-blue-600 border-blue-100'
    return 'bg-indigo-50 text-indigo-500 border-indigo-100'
}

const iconName = (type) => {
    if (type === 'arrival') return 'fa-solid fa-location-dot'
    if (type === 'danger') return 'fa-solid fa-triangle-exclamation'
    if (type === 'status') return 'fa-solid fa-shield'
    return 'fa-solid fa-circle-info'
}

// --- Actions ---
const toggleChat = () => {
    isOpen.value = !isOpen.value
    if (isOpen.value) {
        clearUnread()
        nextTick(() => {
            if (messageArea.value) messageArea.value.scrollTop = messageArea.value.scrollHeight
        })
    }
}

const handleClick = async (notif) => {
    if (!notif.isClickable) return
    isOpen.value = false
    await navigateTo('/current-trip')
}

onMounted(() => init())
</script>

<style scoped>
.bottom-admin { bottom: 80px; }

.notif-pop-enter-active,
.notif-pop-leave-active {
    transition: all 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.notif-pop-enter-from,
.notif-pop-leave-to {
    opacity: 0;
    transform: scale(0.82) translateY(18px) translateX(10px);
}

::-webkit-scrollbar { width: 3px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
</style>
