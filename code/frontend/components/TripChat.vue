<template>
    <div :class="['fixed z-40 transition-all duration-300 ease-in-out trip-chat-wrapper', bottomClass, rightClass]">
        <!-- Floating Button -->
        <button
            @click="toggleChat"
            aria-label="Toggle Trip Chat"
            class="relative flex items-center justify-center w-14 h-14 rounded-full shadow-2xl transition-all duration-300 hover:scale-110 active:scale-95 group"
            :class="[
                isOpen ? 'bg-gray-800' : 'bg-gradient-to-br from-blue-600 to-indigo-700',
                unreadCount > 0 && !isOpen ? 'animate-wiggle bubble-attention' : ''
            ]"
        >
            <!-- Animated rings for attention -->
            <template v-if="unreadCount > 0 && !isOpen">
                <span class="absolute inset-0 rounded-full animate-ping bg-blue-400 opacity-40"></span>
                <span class="absolute -inset-1 rounded-full animate-pulse border-2 border-blue-400/30"></span>
            </template>

            <i v-if="!isOpen" class="fa-solid fa-comments text-white text-xl relative z-10"></i>
            <i v-else class="fa-solid fa-xmark text-white text-lg relative z-10 transition-transform duration-300"></i>

            <!-- Unread badge -->
            <div v-if="unreadCount > 0 && !isOpen"
                class="absolute -top-1.5 -right-1.5 min-w-[24px] h-[24px] bg-red-600 border-4 border-white rounded-full flex items-center justify-center px-1 shadow-xl z-20 animate-pulse">
                <span class="text-[12px] text-white font-black leading-none">{{ unreadCount > 9 ? '9+' : unreadCount }}</span>
            </div>
        </button>

        <!-- Chat Window -->
        <transition name="chat-pop">
            <div v-if="isOpen"
                class="absolute bottom-16 right-0 w-[85vw] sm:w-[350px] bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col border border-gray-100"
                style="height: 480px; max-height: 70vh;"
            >
                <!-- Header -->
                <div class="flex-shrink-0 px-4 py-3 bg-gray-800 flex items-center justify-between shadow-sm z-10">
                    <div class="flex items-center gap-3">
                        <div class="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0">
                            <i class="fa-solid fa-users text-white text-xs"></i>
                        </div>
                        <div>
                            <p class="text-white font-bold text-xs leading-tight">แชทกลุ่มทริป</p>
                            <p class="text-gray-400 text-[10px]">
                                สมาชิก {{ passengers.length + 1 }} คน
                            </p>
                        </div>
                    </div>
                    <button @click="isOpen = false"
                        class="w-7 h-7 flex items-center justify-center rounded-full hover:bg-white/10 text-white/70 transition-colors">
                        <i class="fa-solid fa-xmark text-xs"></i>
                    </button>
                </div>

                <!-- Messages Area -->
                <div ref="messageArea"
                    class="flex-1 overflow-y-auto px-4 py-3 space-y-2 bg-gray-50/60 scroll-smooth"
                >
                    <!-- Carpooling Info Card (AUTO) -->
                    <div v-if="passengers.length > 0" class="w-full mb-3">
                        <div class="rounded-xl overflow-hidden border border-gray-200 bg-white shadow-sm">
                            <div class="bg-gray-50 border-b border-gray-100 px-3 py-1.5">
                                <span class="text-gray-500 text-[10px] font-bold uppercase tracking-wider">ข้อมูลทริปร่วมเดินทาง</span>
                            </div>
                            <div class="p-3 space-y-2">
                                <!-- Route — only show if we have readable names -->
                                <div v-if="carpoolInfo.fromCity || carpoolInfo.toCity" class="flex items-center gap-2">
                                    <div class="flex flex-col items-center gap-0.5 flex-shrink-0">
                                        <div class="w-2 h-2 rounded-full bg-green-500"></div>
                                        <div class="w-0.5 h-4 bg-gray-300"></div>
                                        <div class="w-2 h-2 rounded-full bg-red-500"></div>
                                    </div>
                                    <div class="flex-1 min-w-0">
                                        <p class="text-[10px] text-gray-500">จาก</p>
                                        <p class="text-xs font-bold text-gray-800 truncate">{{ carpoolInfo.fromCity || '—' }}</p>
                                        <p class="text-[10px] text-gray-500 mt-1">ไปยัง</p>
                                        <p class="text-xs font-bold text-gray-800 truncate">{{ carpoolInfo.toCity || '—' }}</p>
                                    </div>
                                </div>
                                <!-- Passengers list -->
                                <div class="border-t border-gray-100 pt-2">
                                    <p class="text-[9px] text-gray-400 font-bold uppercase tracking-wider mb-1.5">ผู้โดยสารในทริปนี้</p>
                                    <div class="flex flex-wrap gap-1.5">
                                        <div v-for="p in passengers" :key="p.id"
                                            class="flex items-center gap-1 bg-blue-50 rounded-full px-2 py-0.5">
                                            <img :src="p.profilePicture || defaultAvatar" class="w-3.5 h-3.5 rounded-full object-cover" />
                                            <span class="text-[9px] font-bold text-blue-700">{{ p.firstName }} {{ p.lastName }}</span>
                                        </div>
                                    </div>
                                </div>
                                <p class="text-[8px] text-gray-400 text-center">✨ แชทนี้มองเห็นได้เฉพาะคนในทริปเท่านั้น</p>
                            </div>
                        </div>
                    </div>

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
                        <!-- Standard Pill for system messages -->
                        <div v-if="msg.isSystem && (!msg.metadata?.type || ['STATUS_UPDATE', 'DRIVER_ACKNOWLEDGE'].includes(msg.metadata?.type))" class="w-full flex justify-center my-2 px-2">
                            <div v-if="msg.text" class="bg-gray-100/80 text-gray-500 text-[10px] font-medium px-4 py-1 rounded-full max-w-[90%] text-center leading-snug">
                                <span v-html="formatMessage(msg.text)"></span>
                            </div>
                        </div>

                        <!-- Chat Bubble / Card Message -->
                        <div v-else-if="!msg.isSystem || msg.metadata?.type" :class="['flex items-end gap-2', isMe(msg) ? 'flex-row-reverse' : 'flex-row']">
                            <!-- Avatar -->
                            <img :src="msg.sender?.profilePicture || defaultAvatar"
                                class="w-6 h-6 rounded-full object-cover flex-shrink-0 mb-0.5 ring-1 ring-gray-200"
                            />
                            <!-- Message Content -->
                            <div class="max-w-[85%] space-y-0.5">
                                <p class="text-[10px] text-gray-400 font-bold mb-0.5 px-1" :class="isMe(msg) ? 'text-right' : 'text-left'">
                                    {{ msg.sender?.firstName }} {{ msg.sender?.lastName }}
                                </p>

                                <!-- Metadata Cards (Arrival, Wait, etc.) -->
                                <template v-if="msg.metadata?.type">
                                    <!-- Case A: Arrival Card -->
                                    <template v-if="msg.metadata.type === 'ARRIVAL'">
                                        <div
                                            class="w-full min-w-[240px] rounded-xl shadow-sm border overflow-hidden bg-white animate-in zoom-in-95 duration-300"
                                            :class="[
                                                msg.metadata?.minutes === 0 ? 'border-emerald-100' : 'border-gray-100',
                                                isMe(msg) ? 'rounded-br-sm' : 'rounded-bl-sm'
                                            ]"
                                        >
                                            <div class="px-3 py-1.5 flex items-center justify-between border-b"
                                                :class="msg.metadata?.minutes === 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-50 text-gray-700'">
                                                <span class="text-[9px] font-bold uppercase tracking-wider">
                                                    {{ msg.metadata?.isUpdate && msg.metadata?.minutes > 0 ? '[แจ้งเปลี่ยนเวลา]' : '' }}
                                                    {{ msg.metadata?.minutes === 0 ? 'ถึงจุดนัดพบแล้ว' : 'แจ้งสถานะรับ-ส่ง' }}
                                                </span>
                                            </div>
                                            <div class="p-3 flex items-center gap-3">
                                                <div class="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                                                    :class="msg.metadata?.minutes === 0 ? 'bg-emerald-100 text-emerald-600' : 'bg-blue-100 text-blue-600'">
                                                    <svg v-if="msg.metadata?.minutes > 0" class="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42.99L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z"/></svg>
                                                    <svg v-else class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                                                </div>
                                                <div class="flex-1 min-w-0">
                                                    <h4 class="text-xs font-black text-gray-900 leading-tight">
                                                        <span class="text-gray-400 mr-1.5">แจ้งถึง:</span>
                                                        <span :class="['font-black px-2 py-0.5 rounded-md mr-1.5', msg.metadata?.minutes === 0 ? 'text-emerald-700 bg-emerald-50' : 'text-blue-700 bg-blue-50']">
                                                            {{ msg.metadata?.targetUserName || msg.metadata?.passengerName }}
                                                        </span>
                                                        <br class="mt-1" />
                                                        <template v-if="msg.metadata?.minutes === 0">ถึงจุดนัดพบเเล้ว!</template>
                                                        <template v-else>จะถึงภายใน: <span class="text-base text-blue-600 underline underline-offset-2">{{ msg.metadata?.minutes }}</span> นาที</template>
                                                    </h4>
                                                </div>
                                            </div>
                                            <div v-if="msg.metadata?.reason" class="px-3 pb-3">
                                                <div class="px-2.5 py-1.5 bg-gray-50 rounded-xl border border-gray-100 flex items-start gap-2">
                                                    <p class="text-[10px] text-gray-600 leading-tight italic">"{{ msg.metadata.reason }}"</p>
                                                </div>
                                            </div>
                                        </div>

                                        <!-- Safety Reminder (Nested under Arrival) -->
                                        <div v-if="myRole === 'PASSENGER' && msg.id === firstArrivalId"
                                            class="w-full min-w-[240px] rounded-xl overflow-hidden border border-amber-100 bg-amber-50/50 animate-in fade-in duration-500 mt-2"
                                        >
                                            <div class="px-3 py-1.5 bg-amber-100 text-amber-800 border-b border-amber-200">
                                                <span class="text-[9px] font-bold uppercase tracking-wider">คำแนะนำด้านความปลอดภัย</span>
                                            </div>
                                            <div class="px-4 py-3 space-y-2">
                                                <p class="text-[10px] text-amber-900 leading-snug">• ตรวจสอบชื่อคนขับและป้ายทะเบียนรถให้ตรงกับในแอป</p>
                                                <p class="text-[10px] text-amber-900 leading-snug">• ห้ามขึ้นรถที่ไม่ตรงกับข้อมูลในแอปโดยเด็ดขาด</p>
                                                <p class="text-[10px] text-amber-900 leading-snug">• แจ้งบุคคลใกล้ชิดทราบเมื่อเริ่มการเดินทาง</p>
                                                <p class="text-[10px] text-amber-900 leading-snug">• กรณีฉุกเฉิน โทรแจ้งตำรวจได้ที่ <span class="font-bold">191</span></p>
                                            </div>
                                        </div>
                                    </template>

                                    <!-- Case B: Passenger Wait Card -->
                                    <template v-else-if="msg.metadata.type === 'PASSENGER_WAIT'">
                                        <div
                                            class="w-full min-w-[240px] rounded-xl shadow-sm border border-orange-100 overflow-hidden bg-white animate-in zoom-in-95 duration-300"
                                            :class="isMe(msg) ? 'rounded-br-sm' : 'rounded-bl-sm'"
                                        >
                                            <div class="px-3 py-1.5 bg-orange-50 text-orange-700 border-b border-orange-100">
                                                <span class="text-[9px] font-bold uppercase tracking-wider">ขอยืนยัน: กรุณารอสักครู่</span>
                                            </div>
                                            <div class="p-3 flex items-center gap-3">
                                                <div class="w-10 h-10 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center flex-shrink-0">
                                                    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                                </div>
                                                <div class="flex-1 min-w-0">
                                                    <h4 class="text-xs font-black text-gray-900 leading-tight">
                                                        <span class="text-orange-700 font-black bg-orange-50 px-1.5 py-0.5 rounded-md mr-1.5">{{ msg.metadata?.passengerName }}</span>
                                                        ขอให้ช่วยรอสักครู่
                                                    </h4>
                                                    <p class="text-[10px] text-gray-400 font-bold mt-0.5 tracking-tight">กำลังรีบไปที่จุดนัดพบ</p>
                                                </div>
                                            </div>
                                            <div v-if="msg.metadata?.reason" class="px-3 pb-3">
                                                <div class="px-2.5 py-1.5 bg-gray-50 rounded-xl border border-gray-100 flex items-start gap-2">
                                                    <p class="text-[10px] text-gray-600 leading-tight italic">"{{ msg.metadata.reason }}"</p>
                                                </div>
                                            </div>
                                            <!-- Driver Acknowledge Button -->
                                            <div v-if="myRole === 'DRIVER'" class="px-3 pb-3">
                                                <button
                                                    @click="acknowledgeWait(msg.metadata?.passengerId, msg.metadata?.passengerName)"
                                                    class="w-full py-2 bg-orange-600 hover:bg-orange-700 text-white text-[10px] font-bold rounded-lg transition-colors flex items-center justify-center gap-2 uppercase tracking-wider"
                                                >
                                                    รับทราบแล้ว
                                                </button>
                                            </div>
                                        </div>
                                    </template>
                                </template>

                                <!-- Case C: Normal Text Message -->
                                <div v-else-if="msg.text" :class="[
                                    'px-3 py-2 rounded-xl text-sm leading-relaxed shadow-sm break-words',
                                    isMe(msg)
                                        ? 'bg-blue-600 text-white rounded-br-none'
                                        : 'bg-white text-gray-800 rounded-bl-none border border-gray-200'
                                ]">
                                    <span v-html="formatMessage(msg.text)"></span>
                                </div>

                                <p :class="['text-[9px] text-gray-400 mt-0.5', isMe(msg) ? 'text-right' : 'text-left']">
                                    {{ formatTime(msg.createdAt) }}
                                </p>
                            </div>
                        </div>
                    </template>
                </div>

                <!-- Input Area -->
                <div class="flex-shrink-0 bg-white border-t border-gray-200">
                    <div class="px-3 py-2">
                        <div class="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3 transition-colors focus-within:bg-white focus-within:border-blue-400">
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
                                class="w-8 h-8 flex items-center justify-center rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-30 disabled:cursor-not-allowed flex-shrink-0 transition-colors"
                            >
                                <i v-if="!isSending" class="fa-solid fa-paper-plane text-xs"></i>
                                <i v-else class="fa-solid fa-circle-notch fa-spin text-xs"></i>
                            </button>
                        </div>
                    </div>
                    <!-- Scope indicator -->
                    <div class="px-3 pb-2 flex justify-center items-center gap-1 opacity-50">
                        <i class="fa-solid fa-lock text-[8px]"></i>
                        <span class="text-[9px]">ข้อความจะส่งถึงทุกคนในทริป</span>
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
    /** Confirmed passenger list { id, firstName, lastName, profilePicture? } */
    passengers: { type: Array, default: () => [] },
    /** Trip route info for carpooling card { fromCity, toCity } */
    routeInfo: { type: Object, default: () => ({}) },
    /** Called when driver wants to send arrival notification */
    onArrivalNotify: { type: Function, default: null },
    bottomClass: { type: String, default: 'bottom-6' },
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

// Find the first arrival message ID for showing Safety Reminder once
const firstArrivalId = computed(() => {
    return messages.value.find(m => m.metadata?.type === 'ARRIVAL')?.id
})

// Carpooling info — use routeInfo prop or fallback
const carpoolInfo = computed(() => {
    const info = props.routeInfo || {}
    return {
        fromCity: info.fromCity || info.origin || info.startLocation || null,
        toCity: info.toCity || info.destination || info.endLocation || null,
    }
})

// --- Helpers ---
const isMe = (msg) => msg.senderId === props.myId

const formatTime = (dateStr) => {
    if (!dateStr) return ''
    return new Date(dateStr).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })
}

/**
 * Highlight names in messages WITHOUT the "@" symbol.
 * Matches patterns like "@Name" and renders the name (without @) highlighted.
 */
const formatMessage = (text) => {
    if (!text) return ''
    // Replace @Name with a highlighted chip (no @ shown)
    return text.replace(/@([^\s:,!?]+)/g, '<span class="inline-flex items-center font-black text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded-md text-[0.85em]">$1</span>')
}

const scrollToBottom = () => {
    nextTick(() => {
        if (messageArea.value) {
            messageArea.value.scrollTop = messageArea.value.scrollHeight
        }
    })
}

// --- Load message history ---
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

        await $api(`/chat/routes/${props.routeId}/messages`, {
            method: 'POST',
            body: { text }
        })
    } catch (e) {
        console.error('[TripChat] Send failed:', e)
        messages.value = messages.value.filter(m => !m.id.startsWith('opt-'))
        inputText.value = text
    } finally {
        isSending.value = false
        chatInput.value?.focus()
    }
}

// --- Driver: Acknowledge Wait Request ---
// Message no longer uses "@" prefix — just the name
const acknowledgeWait = async (passengerId, passengerName) => {
    try {
        const text = `👌 ${passengerName}: คนขับรับทราบแล้วครับ กำลังจอดรอนะ`
        await $api(`/chat/routes/${props.routeId}/messages`, {
            method: 'POST',
            body: {
                text,
                isSystem: true,
                metadata: {
                    type: 'DRIVER_ACKNOWLEDGE',
                    targetUserId: passengerId,
                    targetUserName: passengerName
                }
            }
        })
    } catch (e) {
        console.error('Failed to acknowledge wait:', e)
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
    if (msg.routeId !== props.routeId) return

    const optIdx = messages.value.findIndex(m => m.id.startsWith('opt-') && m.text === msg.text && m.senderId === msg.senderId)
    if (optIdx > -1) {
        messages.value.splice(optIdx, 1, msg)
    } else {
        messages.value.push(msg)
    }
    scrollToBottom()

    if (!isOpen.value && (msg.senderId !== props.myId || msg.isSystem)) {
        unreadCount.value++
    }
}

onMounted(() => {
    const nuxtApp = useNuxtApp()
    const socket = nuxtApp.$socket
    if (socket && props.routeId) {
        socket.emit('join-trip', props.routeId)
    }

    loadMessages()
    onEvent('trip:message', handleTripMessage)
    onEvent('booking:driverArriving', () => {
        if (isOpen.value) isOpen.value = false
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

.no-scrollbar::-webkit-scrollbar { display: none; }
.no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }

/* Custom scrollbar */
::-webkit-scrollbar { width: 3px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
::-webkit-scrollbar-thumb:hover { background: #cbd5e1; }

@keyframes pulse-attention {
  0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.4); }
  50% { transform: scale(1.05); box-shadow: 0 0 20px 10px rgba(59, 130, 246, 0); }
  100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(59, 130, 246, 0); }
}

.animate-wiggle { animation: pulse-attention 2s infinite; }
.bubble-attention { border: 2.5px solid rgba(255, 255, 255, 0.9); }
</style>
