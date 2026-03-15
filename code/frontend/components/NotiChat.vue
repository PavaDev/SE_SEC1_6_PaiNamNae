<template>
    <div class="fixed z-50 bottom-6 right-6 font-sans">
        <!-- Floating Button -->
        <button 
            @click="toggleChat"
            class="relative flex items-center justify-center w-16 h-16 transition-all duration-300 bg-blue-600 border-2 border-white rounded-full shadow-2xl hover:scale-110 active:scale-95 group"
            aria-label="Toggle Trip Status"
        >
            <i v-if="!isOpen" class="text-2xl text-white fa-solid fa-bell"></i>
            <i v-else class="text-2xl text-white fa-solid fa-xmark"></i>
            
            <!-- Notification Badge -->
            <div v-if="hasUnread && !isOpen" class="absolute top-0 right-1 flex items-center justify-center w-5 h-5 bg-red-500 border-2 border-white rounded-full scale-in-center">
                <span class="sr-only">New notifications</span>
            </div>
        </button>

        <!-- Chat Window (NotiChat Center) -->
        <transition name="chat-fade">
            <div 
                v-if="isOpen"
                class="absolute bottom-20 right-0 w-[90vw] sm:w-[380px] h-[550px] max-h-[80vh] bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col transform transition-all duration-300 origin-bottom-right border border-gray-100"
            >
                <!-- Header -->
                <div class="flex items-center justify-between p-5 bg-white border-b border-gray-100">
                    <div class="flex items-center gap-3">
                        <div class="relative w-12 h-12 overflow-hidden bg-blue-50 rounded-2xl border border-blue-100 rotate-3">
                            <div class="flex items-center justify-center w-full h-full text-blue-600">
                                <i class="fa-solid fa-bullhorn text-xl"></i>
                            </div>
                            <div class="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 border-2 border-white rounded-full"></div>
                        </div>
                        <div>
                            <h3 class="font-bold text-gray-800 text-base">NotiChat</h3>
                            <div class="flex items-center gap-1.5">
                                <span class="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                                <p class="text-[10px] text-gray-400 uppercase tracking-widest font-bold">Real-time Updates</p>
                            </div>
                        </div>
                    </div>
                    <button @click="toggleChat" class="flex items-center justify-center w-8 h-8 text-gray-400 transition-all bg-gray-50 rounded-xl hover:bg-gray-100 hover:text-gray-600 hover:rotate-90">
                        <i class="fa-solid fa-xmark text-xs"></i>
                    </button>
                </div>

                <!-- Message Area -->
                <div ref="messageArea" class="flex-1 p-5 overflow-y-auto bg-gray-50/50 space-y-5 scroll-smooth">
                    <div v-if="notifications.length === 0" class="flex flex-col items-center justify-center h-full text-center p-8 opacity-50">
                        <div class="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4 text-gray-300">
                            <i class="fa-solid fa-comment-slash text-3xl"></i>
                        </div>
                        <p class="text-sm text-gray-500 font-medium">ยังไม่มีข้อความส่งตรงถึงคุณ</p>
                        <p class="text-[11px] text-gray-400 mt-1">พร้อมรับการเดินทางครั้งถัดไป</p>
                    </div>

                    <div v-for="notif in notifications" :key="notif.id" class="flex flex-col gap-1 transition-all">
                        <div class="flex justify-start">
                            <div @click="handleClick(notif)" class="flex max-w-[92%] items-start gap-3" :class="notif.isClickable ? 'cursor-pointer hover:scale-[1.02] active:scale-95 transition-all' : ''">
                                <div class="flex-shrink-0 w-9 h-9 rounded-2xl flex items-center justify-center text-[14px] shadow-sm border mt-0.5"
                                     :class="getIconBg(notif.type)">
                                     <i v-if="notif.type === 'arrival'" class="fa-solid fa-location-pin"></i>
                                     <i v-else-if="notif.type === 'status'" class="fa-solid fa-shield"></i>
                                     <i v-else-if="notif.type === 'danger'" class="fa-solid fa-triangle-exclamation"></i>
                                     <i v-else class="fa-solid fa-circle-info"></i>
                                </div>
                                <div class="bg-white px-5 py-3.5 rounded-3xl rounded-tl-none text-[13px] shadow-sm border border-gray-100 transition-all hover:shadow-md hover:border-blue-100">
                                    <div class="whitespace-pre-wrap leading-relaxed text-gray-700 font-semibold" :class="notif.isClickable ? 'text-blue-700' : ''">
                                        {{ notif.text }}
                                    </div>
                                    <div class="mt-2 text-[10px] text-gray-400 flex items-center gap-1.5 font-medium">
                                        <i class="fa-regular fa-clock text-[9px]"></i>
                                        {{ notif.time }}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Footer -->
                <div class="p-4 bg-white border-t border-gray-50 text-center">
                    <p class="text-[10px] text-gray-400 font-medium italic">
                        ข้อความแจ้งเตือนทางเดียว (Read-only)
                    </p>
                </div>
            </div>
        </transition>
    </div>
</template>

<script setup>
import { ref, nextTick, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useNotifications } from '~/composables/useNotifications'

const router = useRouter()
const { notifications, hasUnread, clearUnread, init, isOpen } = useNotifications()

const messageArea = ref(null)

const toggleChat = () => {
    isOpen.value = !isOpen.value
    if (isOpen.value) {
        clearUnread()
        scrollToBottom()
    }
}

const scrollToBottom = () => {
    nextTick(() => {
        if (messageArea.value) {
            messageArea.value.scrollTop = messageArea.value.scrollHeight
        }
    })
}

const handleClick = async (notif) => {
    if (notif.isClickable) {
        isOpen.value = false
        await navigateTo('/current-trip')
    }
}

const getIconBg = (type) => {
    if (type === 'arrival') return 'bg-emerald-50 text-emerald-600 border-emerald-100'
    if (type === 'status') return 'bg-blue-50 text-blue-600 border-blue-100'
    if (type === 'danger') return 'bg-red-50 text-red-600 border-red-100'
    return 'bg-gray-50 text-gray-500 border-gray-200'
}

onMounted(() => {
    init()
})
</script>

<style scoped>
.chat-fade-enter-active,
.chat-fade-leave-active {
    transition: all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.chat-fade-enter-from,
.chat-fade-leave-to {
    opacity: 0;
    transform: scale(0.7) translateY(40px) translateX(40px) rotate(5deg);
}

@keyframes scale-in-center {
  0% { transform: scale(0); opacity: 1; }
  100% { transform: scale(1); opacity: 1; }
}

.scale-in-center {
  animation: scale-in-center 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94) both;
}

::-webkit-scrollbar {
    width: 3px;
}
::-webkit-scrollbar-track {
    background: transparent;
}
::-webkit-scrollbar-thumb {
    background: #f1f1f1;
    border-radius: 10px;
}
</style>
