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

            <!-- Unread badge (Floating outside) -->
            <div v-if="unreadCount > 0 && !isOpen"
                class="absolute -top-1.5 -right-1.5 min-w-[24px] h-[24px] bg-red-600 border-4 border-white rounded-full flex items-center justify-center px-1 shadow-xl z-20">
                <span class="text-[12px] text-white font-black leading-none">{{ unreadCount > 9 ? '9+' : unreadCount }}</span>
            </div>
        </button>

        <!-- Chat Window -->
        <transition name="chat-pop">
            <div v-if="isOpen"
                class="absolute bottom-16 right-0 w-[92vw] sm:w-[400px] bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col border border-gray-100"
                style="height: 540px; max-height: 82vh;"
            >
                <!-- Header -->
                <div class="flex-shrink-0 px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-700 flex items-center justify-between shadow-md z-10">
                    <div class="flex items-center gap-3">
                        <div class="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center ring-2 ring-white/40 flex-shrink-0">
                            <i v-if="activeTab === 'group'" class="fa-solid fa-users text-white text-sm"></i>
                            <img v-else :src="activePassenger?.profilePicture || defaultAvatar" class="w-full h-full rounded-full object-cover" />
                        </div>
                        <div>
                            <p class="text-white font-bold text-sm leading-tight">
                                {{ activeTab === 'group' ? 'Trip Chat (กลุ่ม)' : activePassenger?.firstName + ' ' + (activePassenger?.lastName || '') }}
                            </p>
                            <p class="text-blue-200 text-[10px] font-medium">
                                {{ activeTab === 'group' ? 'ข้อความถึงสมาชิกทุกคนในทริป' : 'สนทนาส่วนตัวกับผู้โดยสาร' }}
                            </p>
                        </div>
                    </div>
                    <button @click="isOpen = false"
                        class="w-7 h-7 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors">
                        <i class="fa-solid fa-xmark text-xs"></i>
                    </button>
                </div>

                <!-- Tab Bar (Driver only, when there are passengers) -->
                <div v-if="myRole === 'DRIVER' && passengers.length > 0"
                    class="flex-shrink-0 flex items-center gap-1 px-3 py-2 bg-gray-50 border-b border-gray-200 overflow-x-auto no-scrollbar">
                    <!-- Group Tab -->
                    <button @click="setTab('group')"
                        :class="[
                            'flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-bold whitespace-nowrap transition-all flex-shrink-0',
                            activeTab === 'group'
                                ? 'bg-blue-600 text-white shadow-sm'
                                : 'bg-white text-gray-500 border border-gray-200 hover:border-blue-300 hover:text-blue-600'
                        ]">
                        <i class="fa-solid fa-users text-[9px]"></i>
                        กลุ่ม
                        <span v-if="unreadByTab['group'] > 0"
                            class="ml-0.5 bg-red-500 text-white text-[8px] font-black rounded-full min-w-[14px] h-[14px] flex items-center justify-center px-0.5">
                            {{ unreadByTab['group'] }}
                        </span>
                    </button>

                    <!-- Per-Passenger Tabs -->
                    <button v-for="p in passengers" :key="p.id"
                        @click="setTab(p.id)"
                        :class="[
                            'flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-bold whitespace-nowrap transition-all flex-shrink-0',
                            activeTab === p.id
                                ? 'bg-indigo-600 text-white shadow-sm'
                                : 'bg-white text-gray-500 border border-gray-200 hover:border-indigo-300 hover:text-indigo-600'
                        ]">
                        <div class="relative flex-shrink-0">
                            <img :src="p.profilePicture || defaultAvatar" class="w-3.5 h-3.5 rounded-full object-cover" />
                            <!-- Status dot -->
                            <span :class="[
                                'absolute -bottom-0.5 -right-0.5 w-1.5 h-1.5 rounded-full border border-white',
                                p.bookingStatus === 'PENDING' ? 'bg-orange-400' :
                                (p.bookingStatus === 'IN_TRANSIT' ? 'bg-green-500' : 'bg-blue-500')
                            ]"></span>
                        </div>
                        {{ p.firstName }}
                        <span v-if="p.bookingStatus === 'PENDING'"
                            class="text-[8px] opacity-70">(รอ)</span>
                        <span v-if="unreadByTab[p.id] > 0"
                            class="ml-0.5 bg-red-500 text-white text-[8px] font-black rounded-full min-w-[14px] h-[14px] flex items-center justify-center px-0.5">
                            {{ unreadByTab[p.id] }}
                        </span>
                    </button>
                </div>

                <!-- Messages Area -->
                <div ref="messageArea"
                    class="flex-1 overflow-y-auto px-4 py-3 space-y-2 bg-gray-50/60 scroll-smooth"
                >
                    <!-- Empty state -->
                    <div v-if="filteredMessages.length === 0"
                        class="flex flex-col items-center justify-center h-full text-center opacity-50 select-none">
                        <div class="w-14 h-14 bg-blue-50 rounded-full flex items-center justify-center mb-3 text-blue-400">
                            <i class="fa-solid fa-comment-dots text-2xl"></i>
                        </div>
                        <p class="text-sm text-gray-500 font-medium">
                            {{ activeTab === 'group' ? 'เริ่มการสนทนากับสมาชิกในทริป' : 'ยังไม่มีข้อความในการสนทนานี้' }}
                        </p>
                        <p class="text-xs text-gray-400 mt-1">ข้อความจะถูกบันทึกตลอดการเดินทาง</p>
                    </div>

                    <template v-for="msg in filteredMessages" :key="msg.id">
                        <!-- Standard Pill for system messages (Non-Card) -->
                        <div v-if="msg.isSystem && (!msg.metadata?.type || ['STATUS_UPDATE', 'DRIVER_ACKNOWLEDGE'].includes(msg.metadata?.type))" class="w-full flex justify-center my-3 px-2">
                            <div v-if="msg.text" class="bg-white/90 border border-gray-100 text-gray-800 text-[11px] font-bold px-4 py-2 rounded-full max-w-[95%] text-center leading-snug shadow-sm backdrop-blur-sm">
                                <i :class="[
                                    'fa-solid mr-1.5 opacity-70',
                                    msg.metadata?.status === 'IN_TRANSIT' ? 'fa-circle-check text-emerald-500' :
                                    (msg.metadata?.status === 'COMPLETED' ? 'fa-flag-checkered text-blue-600' :
                                    (msg.metadata?.type === 'DRIVER_ACKNOWLEDGE' ? 'fa-thumbs-up text-indigo-500' : 'fa-bell text-amber-500'))
                                ]"></i>
                                <span v-html="formatSystemMessage(msg.text)"></span>
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
                                    {{ msg.sender?.firstName }}
                                </p>

                                <!-- Case A: Arrival Card -->
                                <div v-if="msg.metadata?.type === 'ARRIVAL'"
                                    class="w-full min-w-[260px] rounded-2xl shadow-lg border-2 overflow-hidden bg-white animate-in zoom-in-95 duration-300"
                                    :class="msg.metadata?.minutes === 0 ? 'border-emerald-200' : (msg.metadata?.isUpdate ? 'border-amber-200' : 'border-blue-100')"
                                >
                                    <div class="px-3 py-1.5 flex items-center justify-between"
                                        :class="msg.metadata?.minutes === 0 ? 'bg-emerald-600' : (msg.metadata?.isUpdate ? 'bg-amber-500' : 'bg-blue-600')">
                                        <div class="flex items-center gap-1.5 overflow-hidden">
                                            <svg v-if="msg.metadata?.minutes === 0" class="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /></svg>
                                            <svg v-else class="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42.99L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z"/></svg>
                                            <span class="text-[9px] font-black text-white uppercase tracking-wider truncate">
                                                {{ msg.metadata?.minutes === 0 ? 'ถึงที่หมายเเล้ว!' : (msg.metadata?.isUpdate ? 'อัพเดทเวลาเดินทาง' : 'กำลังเดินทางมารับ') }}
                                            </span>
                                        </div>
                                    </div>
                                    <div class="p-3 flex items-center gap-3">
                                        <div class="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                                            :class="msg.metadata?.minutes === 0 ? 'bg-emerald-100 text-emerald-600' : (msg.metadata?.isUpdate ? 'bg-amber-100 text-amber-600' : 'bg-blue-100 text-blue-600')">
                                            <svg v-if="msg.metadata?.minutes > 0" class="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42.99L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z"/></svg>
                                            <svg v-else class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                                        </div>
                                        <div class="flex-1 min-w-0">
                                            <h4 class="text-xs font-black text-gray-900 leading-tight">
                                                <span class="text-blue-600 mr-2">@{{ msg.metadata?.passengerName }}</span>
                                                <template v-if="msg.metadata?.minutes === 0">ถึงที่หมายเเล้ว!</template>
                                                <template v-else>แจ้งเข้าใกล้: อีก <span class="text-base text-blue-600 underline underline-offset-2">{{ msg.metadata?.minutes }}</span> นาที</template>
                                            </h4>
                                        </div>
                                    </div>
                                    <div v-if="msg.metadata?.reason" class="px-3 pb-3">
                                        <div class="px-2 py-1.5 bg-gray-50 rounded-xl border border-gray-100 flex items-start gap-2">
                                            <p class="text-[9px] text-gray-600 leading-tight italic">"{{ msg.metadata.reason }}"</p>
                                        </div>
                                    </div>
                                </div>

                                <!-- Case B: Passenger Wait Card -->
                                <div v-else-if="msg.metadata?.type === 'PASSENGER_WAIT'"
                                    class="w-full min-w-[260px] rounded-2xl shadow-lg border-2 border-indigo-200 overflow-hidden bg-white animate-in zoom-in-95 duration-300"
                                >
                                    <div class="px-3 py-1.5 bg-indigo-600 flex items-center gap-1.5 overflow-hidden">
                                        <svg class="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 11.5V14m0-2.5v-6a1.5 1.5 0 113 0V12m-3 .5V12m3 .5V12m0 0V5a1.5 1.5 0 013 0v7m0 0V6a1.5 1.5 0 113 0v7m0 0v1a4.5 4.5 0 01-9 0v-1m9 1H7" /></svg>
                                        <span class="text-[9px] font-black text-white uppercase tracking-wider">ขอยืนยัน: ให้รอก่อน</span>
                                    </div>
                                    <div class="p-3 flex items-center gap-3">
                                        <div class="w-10 h-10 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center flex-shrink-0">
                                            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                        </div>
                                        <div class="flex-1 min-w-0">
                                            <h4 class="text-xs font-black text-gray-900 leading-tight">ขอให้ช่วยรอก่อนสักครู่</h4>
                                            <p class="text-[9px] text-gray-500 font-medium">ผู้โดยสารกำลังรีบไปที่จุดนัดพบ</p>
                                        </div>
                                    </div>
                                    <div v-if="msg.metadata?.reason" class="px-3 pb-3">
                                        <div class="px-2 py-1.5 bg-indigo-50/50 rounded-xl border border-indigo-100 flex items-start gap-2">
                                            <p class="text-[9px] text-indigo-800 leading-tight italic">"{{ msg.metadata.reason }}"</p>
                                        </div>
                                    </div>
                                    <!-- Driver Acknowledge Button -->
                                    <div v-if="myRole === 'DRIVER'" class="px-3 pb-3">
                                        <button
                                            @click="acknowledgeWait(msg.metadata?.passengerId, msg.metadata?.passengerName)"
                                            class="w-full py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-bold rounded-lg transition-all active:scale-95 shadow-sm flex items-center justify-center gap-1.5"
                                        >
                                            <i class="fa-solid fa-check-circle"></i>
                                            รับทราบเเล้ว (จะรอนะ)
                                        </button>
                                    </div>
                                </div>

                                <!-- Case C: Normal Text Message (With Bubble) -->
                                <div v-else-if="msg.text" :class="[
                                    'px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed shadow-sm break-words',
                                    isMe(msg)
                                        ? 'bg-gradient-to-br from-blue-600 to-indigo-600 text-white rounded-br-sm'
                                        : 'bg-white text-gray-800 rounded-bl-sm border border-gray-100'
                                ]">
                                    <span v-html="formatSystemMessage(msg.text)"></span>
                                </div>

                                <p :class="['text-[9px] text-gray-400 mt-0.5', isMe(msg) ? 'text-right' : 'text-left']">
                                    {{ formatTime(msg.createdAt) }}
                                </p>
                            </div>
                        </div>
                    </template>
                </div>

                <!-- Input Area -->
                <div class="flex-shrink-0 bg-white border-t border-gray-100 shadow-[0_-2px_8px_rgba(0,0,0,0.04)]">
                    <div class="px-3 pt-2 pb-1">
                        <div class="flex items-center gap-2 bg-gray-100/80 rounded-xl px-3 py-1 focus-within:bg-white focus-within:ring-2 focus-within:ring-blue-500/30 focus-within:border-blue-300 border border-transparent transition-all">
                            <input
                                v-model="inputText"
                                ref="chatInput"
                                type="text"
                                :placeholder="isTripEnded ? 'การสนทนาจบลงแล้ว' : 'พิมพ์ข้อความถึงทุกคนในทริป...'" 
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
                    <!-- Scope indicator -->
                    <div class="px-3 pb-2 flex items-center gap-1">
                        <i class="fa-solid fa-users text-[8px] text-gray-400"></i>
                        <span class="text-[9px] text-gray-400">ข้อความจะส่งถึงทุกคนในทริป</span>
                        <span class="ml-1 text-[9px] text-blue-500 font-bold">เห็นทุกคน</span>
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
    /** Confirmed list { id, firstName, lastName, profilePicture? } */
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

// --- Tab State ---
// 'group' or a passenger id
const activeTab = ref('group')

// Track unread per-tab
const unreadByTab = ref({ group: 0 })

const defaultAvatar = 'https://ui-avatars.com/api/?background=random'

const isTripEnded = computed(() => ['COMPLETED', 'CANCELLED'].includes(props.tripStatus))

const activePassenger = computed(() =>
    activeTab.value !== 'group'
        ? props.passengers.find(p => p.id === activeTab.value) || null
        : null
)

// --- Message Filtering by Tab ---
// Group tab: show ALL messages.
// Passenger tab: show messages FROM that passenger (their chats + system msgs for them).
const filteredMessages = computed(() => {
    if (props.myRole !== 'DRIVER' || activeTab.value === 'group') {
        return messages.value
    }

    const pid = activeTab.value
    return messages.value.filter(msg => {
        // System messages targeted to this passenger
        if (msg.isSystem && msg.metadata) {
            const meta = msg.metadata
            if (meta.targetUserId === pid) return true
            if (meta.passengerId === pid) return true
            return false
        }
        // Regular messages FROM this passenger
        if (msg.senderId === pid) return true
        return false
    })
})

const setTab = (tabId) => {
    activeTab.value = tabId
    // Reset unread for this tab
    if (unreadByTab.value[tabId] !== undefined) {
        unreadByTab.value[tabId] = 0
    }
    scrollToBottom()
}

// --- Helpers ---
const isMe = (msg) => msg.senderId === props.myId

const formatTime = (dateStr) => {
    if (!dateStr) return ''
    return new Date(dateStr).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })
}

const formatSystemMessage = (text) => {
    return text.replace(/(@[^\s:]+)/g, '<span class="text-blue-700 font-black bg-blue-50 px-1 rounded">$1</span>')
}

const scrollToBottom = () => {
    nextTick(() => {
        if (messageArea.value) {
            messageArea.value.scrollTop = messageArea.value.scrollHeight
        }
    })
}

// --- Determine which tab a message belongs to (for unread counting) ---
const getMessageTab = (msg) => {
    if (props.myRole !== 'DRIVER') return 'group'
    // System messages targeted at specific passenger
    if (msg.isSystem && msg.metadata) {
        const pid = msg.metadata.targetUserId || msg.metadata.passengerId
        if (pid && props.passengers.find(p => p.id === pid)) return pid
    }
    // Messages from a passenger
    if (props.passengers.find(p => p.id === msg.senderId)) return msg.senderId
    // Default: group
    return 'group'
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
const acknowledgeWait = async (passengerId, passengerName) => {
    try {
        const text = `👌 @${passengerName}: คนขับรับทราบแล้วครับ กำลังจอดรอนะ`
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
        // Clear unread for current tab
        unreadByTab.value[activeTab.value] = 0
        // Recalculate total
        unreadCount.value = 0
        scrollToBottom()
        nextTick(() => chatInput.value?.focus())
    }
}

// --- Socket: incoming trip messages ---
const handleTripMessage = (msg) => {
    if (msg.routeId !== props.routeId) return

    // Remove optimistic duplicate if exists
    const optIdx = messages.value.findIndex(m => m.id.startsWith('opt-') && m.text === msg.text && m.senderId === msg.senderId)
    if (optIdx > -1) {
        messages.value.splice(optIdx, 1, msg)
    } else {
        messages.value.push(msg)
    }
    scrollToBottom()

    // Increment unread if chat is closed or message is from other person
    if (!isOpen.value && (msg.senderId !== props.myId || msg.isSystem)) {
        unreadCount.value++

        // Track per-tab unread for driver
        const tab = getMessageTab(msg)
        if (!unreadByTab.value[tab]) unreadByTab.value[tab] = 0
        if (activeTab.value !== tab || !isOpen.value) {
            unreadByTab.value[tab]++
        }
    }
}

// Init unreadByTab when passengers change
watch(() => props.passengers, (newPassengers) => {
    newPassengers.forEach(p => {
        if (unreadByTab.value[p.id] === undefined) {
            unreadByTab.value[p.id] = 0
        }
    })
}, { immediate: true })

onMounted(() => {
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

@keyframes wiggle {
  0%, 100% { transform: rotate(0deg); }
  25% { transform: rotate(-8deg); }
  50% { transform: rotate(8deg); }
  75% { transform: rotate(-4deg); }
}

.animate-wiggle {
  animation: wiggle 0.5s ease-in-out infinite;
}

.bubble-attention {
  box-shadow: 0 0 20px rgba(59, 130, 246, 0.5);
  border: 2px solid rgba(255, 255, 255, 0.8);
}
</style>
