<template>
    <div :class="['fixed z-40 transition-all duration-300 ease-in-out trip-chat-wrapper', bottomClass, rightClass]">
        <!-- Floating Button -->
        <button
            @click="toggleChat"
            aria-label="Toggle Trip Chat"
            class="relative flex items-center justify-center w-14 h-14 rounded-full shadow-2xl transition-all duration-300 hover:scale-110 active:scale-95 overflow-hidden group"
            :class="isOpen ? 'bg-gray-800' : 'bg-gradient-to-br from-blue-600 to-indigo-700'"
        >
            <!-- Animated ring when closed and has unread -->
            <span v-if="unreadCount > 0 && !isOpen" class="absolute inset-0 rounded-full animate-ping bg-blue-400 opacity-30"></span>
            <i v-if="!isOpen" class="fa-solid fa-comments text-white text-xl relative z-10"></i>
            <i v-else class="fa-solid fa-xmark text-white text-lg relative z-10 transition-transform duration-300"></i>

            <!-- Unread badge -->
            <div v-if="unreadCount > 0 && !isOpen"
                class="absolute -top-0.5 -right-0.5 min-w-[20px] h-5 bg-red-500 border-2 border-white rounded-full flex items-center justify-center px-1">
                <span class="text-[10px] text-white font-bold leading-none">{{ unreadCount > 9 ? '9+' : unreadCount }}</span>
            </div>
        </button>

        <!-- Chat Window -->
        <transition name="chat-pop">
            <div v-if="isOpen"
                class="absolute bottom-16 right-0 w-[92vw] sm:w-[380px] h-[520px] max-h-[78vh] bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col border border-gray-100"
            >
                <!-- Header -->
                <div class="flex-shrink-0 px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-700 flex items-center justify-between shadow-md z-10">
                    <div class="flex items-center gap-3">
                        <div class="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center ring-2 ring-white/40">
                            <i class="fa-solid fa-users text-white text-sm"></i>
                        </div>
                        <div>
                            <p class="text-white font-bold text-sm leading-tight">Trip Chat</p>
                            <p class="text-blue-200 text-[10px] font-medium">คุยรวมสมาชิกในทริป</p>
                        </div>
                    </div>
                    <button @click="isOpen = false"
                        class="w-7 h-7 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors">
                        <i class="fa-solid fa-xmark text-xs"></i>
                    </button>
                </div>

                <!-- Messages Area -->
                <div ref="messageArea"
                    class="flex-1 overflow-y-auto px-4 py-3 space-y-2 bg-gray-50/60 scroll-smooth"
                >
                    <!-- Empty state -->
                    <div v-if="messages.length === 0"
                        class="flex flex-col items-center justify-center h-full text-center opacity-50 select-none">
                        <div class="w-14 h-14 bg-blue-50 rounded-full flex items-center justify-center mb-3 text-blue-400">
                            <i class="fa-solid fa-comment-dots text-2xl"></i>
                        </div>
                        <p class="text-sm text-gray-500 font-medium">เริ่มการสนทนากับสมาชิกในทริป</p>
                        <p class="text-xs text-gray-400 mt-1">ข้อความจะถูกบันทึกตลอดการเดินทาง</p>
                    </div>

                    <template v-for="msg in messages" :key="msg.id">
                        <!-- System Message (arrival notification) -->
                        <div v-if="msg.isSystem" class="w-full flex justify-center my-3 px-2">
                            <!-- Enhanced Arrival Card -->
                            <div v-if="msg.metadata?.type === 'ARRIVAL'" 
                                class="w-full max-w-[92%] rounded-2xl shadow-lg border-2 overflow-hidden bg-white animate-in zoom-in-95 duration-300"
                                :class="msg.metadata?.isUpdate ? 'border-amber-200' : 'border-blue-100'"
                            >
                                <!-- Header based on first/update -->
                                <div class="px-3 py-1.5 flex items-center justify-between"
                                    :class="msg.metadata?.isUpdate ? 'bg-amber-500' : 'bg-blue-600'">
                                    <div class="flex items-center gap-1.5 overflow-hidden">
                                        <i :class="msg.metadata?.isUpdate ? 'fa-solid fa-rotate-right' : 'fa-solid fa-car-side'" class="text-[10px] text-white"></i>
                                        <span class="text-[9px] font-black text-white uppercase tracking-wider truncate">
                                            {{ msg.metadata?.isUpdate ? 'อัพเดทเวลา: เเจ้งเปลี่ยนเวลา' : 'การเเจ้งเตือน: กำลังเดินทาง' }}
                                        </span>
                                    </div>
                                    <span class="text-[8px] font-bold text-white/80 whitespace-nowrap">{{ formatTime(msg.createdAt) }}</span>
                                </div>
                                
                                <div class="p-3.5 flex items-center gap-4">
                                    <!-- Icon/Visual -->
                                    <div class="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0"
                                        :class="msg.metadata?.isUpdate ? 'bg-amber-100 text-amber-600' : 'bg-blue-100 text-blue-600'">
                                        <i :class="msg.metadata?.minutes === 0 ? 'fa-solid fa-location-dot' : (msg.metadata?.isUpdate ? 'fa-solid fa-rotate-right' : 'fa-solid fa-car-side')" class="text-xl"></i>
                                    </div>
                                    
                                    <div class="flex-1 min-w-0">
                                        <h4 class="text-xs font-black text-gray-900 leading-tight mb-0.5">
                                            {{ msg.metadata?.minutes === 0 ? 'คนขับถึงจุดนัดพบเเล้ว!' : `จะถึงในอีกประมาณ ${msg.metadata?.minutes} นาที` }}
                                        </h4>
                                        <p class="text-[10px] text-gray-500 font-medium leading-tight">
                                            {{ msg.metadata?.minutes > 0 ? 'กรุณาเตรียมตัวให้พร้อม' : 'คนขับจอดรออยู่ที่จุดรับของคุณเเล้ว' }}
                                        </p>
                                    </div>
                                </div>
                                
                                <!-- Reason block if exists -->
                                <div v-if="msg.metadata?.reason" class="px-3.5 pb-3.5">
                                    <div class="px-2.5 py-1.5 bg-gray-50 rounded-xl border border-gray-100 flex items-start gap-2">
                                        <i class="fa-solid fa-comment-dots text-[9px] text-gray-400 mt-0.5"></i>
                                        <p class="text-[10px] text-gray-600 leading-tight italic font-medium italic">"{{ msg.metadata.reason }}"</p>
                                    </div>
                                </div>
                            </div>

                            <!-- Standard Pill for other system messages -->
                            <div v-else class="bg-amber-50/80 border border-amber-100 text-amber-800 text-[11px] font-medium px-4 py-1.5 rounded-full max-w-[95%] text-center leading-snug shadow-sm backdrop-blur-sm">
                                <i class="fa-solid fa-bell text-amber-500 mr-1.5 opacity-70"></i>
                                <span v-html="formatSystemMessage(msg.text)"></span>
                            </div>
                        </div>

                        <!-- Chat Bubble -->
                        <div v-else :class="['flex items-end gap-2', isMe(msg) ? 'flex-row-reverse' : 'flex-row']">
                            <!-- Avatar (only for other person) -->
                            <img v-if="!isMe(msg)"
                                :src="msg.sender?.profilePicture || defaultAvatar"
                                class="w-6 h-6 rounded-full object-cover flex-shrink-0 mb-0.5 ring-1 ring-gray-200"
                            />
                            <!-- Bubble -->
                            <div class="max-w-[75%] space-y-0.5">
                                <p v-if="!isMe(msg)" class="text-[10px] text-gray-400 font-medium ml-1">
                                    {{ msg.sender?.firstName }}
                                </p>
                                <div :class="[
                                    'px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed shadow-sm break-words',
                                    isMe(msg)
                                        ? 'bg-gradient-to-br from-blue-600 to-indigo-600 text-white rounded-br-sm'
                                        : 'bg-white text-gray-800 rounded-bl-sm border border-gray-100'
                                ]">
                                    {{ msg.text }}
                                </div>
                                <p :class="['text-[10px] text-gray-400 px-1', isMe(msg) ? 'text-right' : 'text-left']">
                                    {{ formatTime(msg.createdAt) }}
                                </p>
                            </div>
                        </div>
                    </template>
                </div>

                <!-- Input Area -->
                <div class="flex-shrink-0 px-3 pb-3 pt-2 bg-white border-t border-gray-100 shadow-[0_-2px_8px_rgba(0,0,0,0.04)]">
                    <div class="flex items-center gap-2 bg-gray-100/80 rounded-xl px-3 py-1 focus-within:bg-white focus-within:ring-2 focus-within:ring-blue-500/30 focus-within:border-blue-300 border border-transparent transition-all">
                        <input
                            v-model="inputText"
                            ref="chatInput"
                            type="text"
                            :placeholder="isTripEnded ? 'การสนทนาจบลงแล้ว' : 'พิมพ์ข้อความ...'"
                            :disabled="isTripEnded"
                            class="flex-1 bg-transparent text-sm py-2 outline-none text-gray-800 placeholder-gray-400 min-w-0 disabled:opacity-50"
                            @keyup.enter="sendMessage"
                        />
                        <button
                            @click="sendMessage"
                            :disabled="!inputText.trim() || isSending || isTripEnded"
                            class="w-8 h-8 flex items-center justify-center rounded-lg bg-blue-600 text-white transition-all hover:bg-blue-700 active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed flex-shrink-0"
                        >
                            <i v-if="!isSending" class="fa-solid fa-paper-plane text-xs -translate-x-px"></i>
                            <i v-else class="fa-solid fa-circle-notch fa-spin text-xs"></i>
                        </button>
                    </div>
                </div>
            </div>
        </transition>
    </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'

const props = defineProps({
    routeId: { type: String, required: true },
    myId: { type: String, required: true },
    myRole: { type: String, required: true }, // 'DRIVER' | 'PASSENGER'
    tripStatus: { type: String, default: 'AVAILABLE' },
    /** Confirmed list { id, firstName, lastName } */
    passengers: { type: Array, default: () => [] },
    /** Called when driver wants to send arrival notification (minutes, targetUserId) */
    onArrivalNotify: { type: Function, default: null },
    /** bottom offset class if needed (e.g. when on admin pages) */
    bottomClass: { type: String, default: 'bottom-6' },
    /** right offset — separate from notification bubble */
    rightClass: { type: String, default: 'right-6' },
})

const { $api } = useNuxtApp()
const { onEvent, offEvent } = useSocket()

const isOpen = ref(false)
const messages = ref([])
const inputText = ref('')
const isSending = ref(false)
const unreadCount = ref(0)
const messageArea = ref(null)
const chatInput = ref(null)

const defaultAvatar = 'https://ui-avatars.com/api/?background=random'

const isTripEnded = computed(() => ['COMPLETED', 'CANCELLED'].includes(props.tripStatus))

// --- Helpers ---
const isMe = (msg) => msg.senderId === props.myId

const formatTime = (dateStr) => {
    if (!dateStr) return ''
    return new Date(dateStr).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })
}

const formatSystemMessage = (text) => {
    // Style @tag parts - support Thai characters (non-space)
    return text.replace(/(@[^\s:]+)/g, '<span class="text-blue-600 font-bold">$1</span>')
}



const scrollToBottom = () => {
    nextTick(() => {
        if (messageArea.value) {
            messageArea.value.scrollTop = messageArea.value.scrollHeight
        }
    })
}

// --- Load message history from DB ---
const loadMessages = async () => {
    if (!props.routeId) return
    try {
        const data = await $api(`/chat/routes/${props.routeId}/messages`)
        messages.value = Array.isArray(data) ? data : []
        scrollToBottom()
    } catch (e) {
        console.error('[TripChat] Failed to load messages:', e)
    }
}

// --- Send a chat message ---
const sendMessage = async () => {
    const text = inputText.value.trim()
    if (!text || isSending.value) return
    isSending.value = true
    inputText.value = ''
    try {
        // Optimistic update — add immediately
        const optimistic = {
            id: `opt-${Date.now()}`,
            senderId: props.myId,
            senderRole: props.myRole,
            text,
            isSystem: false,
            createdAt: new Date().toISOString(),
            sender: { id: props.myId, firstName: '', profilePicture: '' }
        }
        messages.value.push(optimistic)
        scrollToBottom()

        // Send to server (server emits socket which all clients including self receive)
        await $api(`/chat/routes/${props.routeId}/messages`, {
            method: 'POST',
            body: { text }
        })

        // Remove optimistic once server confirms via socket
    } catch (e) {
        console.error('[TripChat] Send failed:', e)
        // Remove optimistic on failure
        messages.value = messages.value.filter(m => !m.id.startsWith('opt-'))
        inputText.value = text
    } finally {
        isSending.value = false
        chatInput.value?.focus()
    }
}

// --- Toggle ---
const toggleChat = () => {
    isOpen.value = !isOpen.value
    if (isOpen.value) {
        unreadCount.value = 0
        scrollToBottom()
        nextTick(() => chatInput.value?.focus())
    }
}

// --- Socket: incoming trip messages ---
const handleTripMessage = (msg) => {
    // Safety: ignore messages from other trips (shouldn't happen but good for robustness)
    if (msg.routeId !== props.routeId) return

    // Remove optimistic duplicate if exists
    const optIdx = messages.value.findIndex(m => m.id.startsWith('opt-') && m.text === msg.text && m.senderId === msg.senderId)
    if (optIdx > -1) {
        messages.value.splice(optIdx, 1, msg)
    } else {
        messages.value.push(msg)
    }
    scrollToBottom()

    // Increment unread if chat is closed and message is from other person
    if (!isOpen.value && (msg.senderId !== props.myId || msg.isSystem)) {
        unreadCount.value++
    }
}

onMounted(() => {
    // Join the trip socket room
    const nuxtApp = useNuxtApp()
    const socket = nuxtApp.$socket
    if (socket && props.routeId) {
        socket.emit('join-trip', props.routeId)
    }

    loadMessages()
    onEvent('trip:message', handleTripMessage)
    onEvent('booking:driverArriving', () => {
        if (isOpen.value) {
            isOpen.value = false
        }
    })
})

onUnmounted(() => {
    const nuxtApp = useNuxtApp()
    const socket = nuxtApp.$socket
    if (socket && props.routeId) {
        socket.emit('leave-trip', props.routeId)
    }
    offEvent('trip:message', handleTripMessage)
    offEvent('booking:driverArriving')
})
</script>

<style scoped>
.chat-pop-enter-active,
.chat-pop-leave-active {
    transition: all 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.chat-pop-enter-from,
.chat-pop-leave-to {
    opacity: 0;
    transform: scale(0.85) translateY(16px) translateX(8px);
}

.trip-chat-wrapper {
    font-family: 'Kanit', sans-serif;
}

.no-scrollbar::-webkit-scrollbar {
    display: none;
}
.no-scrollbar {
    -ms-overflow-style: none;
    scrollbar-width: none;
}

/* Custom scrollbar */
::-webkit-scrollbar { width: 3px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
::-webkit-scrollbar-thumb:hover { background: #cbd5e1; }
</style>
