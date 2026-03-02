<template>
    <div class="fixed z-50 bottom-6 right-6 font-sans" :class="{ 'bottom-admin': isAdminPage }">
        <!-- Floating Button -->
        <button 
            @click="toggleChat"
            class="relative flex items-center justify-center w-16 h-16 transition-all duration-300 bg-blue-600 border-2 border-white rounded-full shadow-2xl hover:scale-110 active:scale-95 group"
            aria-label="Toggle Trip Status"
        >
            <i v-if="!isOpen" class="text-2xl text-white fas fa-bell"></i>
            <i v-else class="text-2xl text-white fas fa-times"></i>
            
            <!-- Notification Badge -->
            <div v-if="hasUnread && !isOpen" class="absolute top-0 right-1 flex items-center justify-center w-5 h-5 bg-red-500 border-2 border-white rounded-full">
                <span class="sr-only">New notifications</span>
            </div>
        </button>

        <!-- Chat Window (Notification Center) -->
        <transition name="chat-fade">
            <div 
                v-if="isOpen"
                class="absolute bottom-20 right-0 w-[90vw] sm:w-[380px] h-[600px] max-h-[80vh] bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col transform transition-all duration-300 origin-bottom-right border border-gray-100"
            >
                <!-- Header -->
                <div class="flex items-center justify-between p-4 bg-white border-b border-gray-100">
                    <div class="flex items-center gap-3">
                        <div class="relative w-11 h-11 overflow-hidden bg-blue-50 rounded-full border border-blue-100">
                            <div class="flex items-center justify-center w-full h-full text-blue-600">
                                <i class="fas fa-info-circle text-xl"></i>
                            </div>
                            <div class="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
                        </div>
                        <div>
                            <h3 class="font-bold text-gray-800 text-sm">Trip Notification</h3>
                            <div class="flex items-center gap-1.5">
                                <span class="w-2 h-2 bg-green-500 rounded-full"></span>
                                <p class="text-[10px] text-gray-500 uppercase tracking-wider font-semibold">Active Monitoring</p>
                            </div>
                        </div>
                    </div>
                    <button @click="toggleChat" class="flex items-center justify-center w-8 h-8 text-gray-400 transition-colors bg-gray-50 rounded-full hover:bg-gray-100 hover:text-gray-600">
                        <i class="fas fa-times text-xs"></i>
                    </button>
                </div>

                <!-- Message Area -->
                <div ref="messageArea" class="flex-1 p-4 overflow-y-auto bg-gray-50/30 space-y-4 scroll-smooth">
                    <div v-if="notifications.length === 0" class="flex flex-col items-center justify-center h-full text-center p-8">
                        <div class="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4 text-gray-400">
                            <i class="fas fa-bell-slash text-2xl"></i>
                        </div>
                        <p class="text-xs text-gray-400 font-medium">ไม่มีแจ้งเตือนในขณะนี้</p>
                    </div>

                    <div v-for="notif in notifications" :key="notif.id" class="flex justify-start">
                        <div class="flex max-w-[90%] items-start gap-2">
                            <div class="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-[12px] text-blue-600 shadow-sm border border-blue-200 mt-0.5">
                                 <i v-if="notif.type === 'arrival'" class="fas fa-map-marker-alt"></i>
                                 <i v-else-if="notif.type === 'status'" class="fas fa-check-circle"></i>
                                 <i v-else class="fas fa-info-circle"></i>
                            </div>
                            <div class="bg-white px-4 py-3 rounded-2xl rounded-tl-none text-sm shadow-sm border border-gray-100 transition-all hover:border-blue-200">
                                <div class="whitespace-pre-wrap leading-relaxed text-gray-800 font-medium">{{ notif.text }}</div>
                                <div class="mt-1.5 text-[10px] text-gray-400 flex items-center gap-1">
                                    <i class="far fa-clock"></i>
                                    {{ notif.time }}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Footer (Information only, no input) -->
                <div class="p-4 border-t border-gray-100 bg-white">
                    <p class="text-[10px] text-gray-400 text-center italic">
                        แจ้งเตือนเฉพาะข้อมูลการเดินทางเท่านั้น หากมีปัญหาโปรดติดต่อแอดมินทางช่องทางอื่น
                    </p>
                </div>
            </div>
        </transition>
    </div>
</template>

<script setup>
import { ref, nextTick, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useNotifications } from '~/composables/useNotifications'

const route = useRoute()
const { notifications, hasUnread, clearUnread, init, isOpen } = useNotifications()

const messageArea = ref(null)

const isAdminPage = computed(() => route.path.startsWith('/admin'))

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

onMounted(() => {
    init()
})
</script>

<style scoped>
.fixed {
    transition: all 0.3s ease;
}

.bottom-admin {
    bottom: 80px; 
}

.chat-fade-enter-active,
.chat-fade-leave-active {
    transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.chat-fade-enter-from,
.chat-fade-leave-to {
    opacity: 0;
    transform: scale(0.8) translateY(20px) translateX(20px);
}

/* Custom Scrollbar */
::-webkit-scrollbar {
    width: 4px;
}
::-webkit-scrollbar-track {
    background: transparent;
}
::-webkit-scrollbar-thumb {
    background: #e5e7eb;
    border-radius: 10px;
}
::-webkit-scrollbar-thumb:hover {
    background: #d1d5db;
}
</style>
