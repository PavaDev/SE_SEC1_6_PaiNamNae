<template>
    <div class="fixed z-50 bottom-6 right-6 font-sans" :class="{ 'right-admin': isAdminPage }">
        <!-- Floating Button -->
        <button 
            @click="toggleChat"
            class="relative flex items-center justify-center w-16 h-16 transition-all duration-300 bg-blue-600 border-2 border-white rounded-full shadow-2xl hover:scale-110 active:scale-95 group"
            :class="{ 'opacity-90': isAdminPage }"
            aria-label="Toggle Chat"
        >
            <i v-if="!isOpen" class="text-2xl text-white fas fa-headset"></i>
            <i v-else class="text-2xl text-white fas fa-times"></i>
            
            <!-- Notification Badge -->
            <div v-if="hasNotification && !isOpen" class="absolute top-0 right-1 flex items-center justify-center w-5 h-5 bg-red-500 border-2 border-white rounded-full">
                <span class="sr-only">New messages</span>
            </div>
        </button>

        <!-- Chat Window -->
        <transition name="chat-fade">
            <div 
                v-if="isOpen"
                class="absolute bottom-20 right-0 w-[90vw] sm:w-[380px] h-[600px] max-h-[80vh] bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col transform transition-all duration-300 origin-bottom-right border border-gray-100"
            >
                <!-- Header -->
                <div class="flex items-center justify-between p-4 bg-white border-b border-gray-100">
                    <div class="flex items-center gap-3">
                        <div class="relative w-11 h-11 overflow-hidden bg-gray-100 rounded-full border border-gray-200">
                            <!-- Using a system icon as avatar -->
                            <div class="flex items-center justify-center w-full h-full text-gray-400 bg-gray-50">
                                <i class="fas fa-headset text-xl"></i>
                            </div>
                            <div class="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
                        </div>
                        <div>
                            <h3 class="font-bold text-gray-800 text-sm">แอดมิน (Admin Support)</h3>
                            <div class="flex items-center gap-1.5">
                                <span class="w-2 h-2 bg-green-500 rounded-full"></span>
                                <p class="text-[10px] text-gray-500 uppercase tracking-wider font-semibold">Online</p>
                            </div>
                        </div>
                    </div>
                    <button @click="toggleChat" class="flex items-center justify-center w-8 h-8 text-gray-400 transition-colors bg-gray-50 rounded-full hover:bg-gray-100 hover:text-gray-600">
                        <i class="fas fa-times text-xs"></i>
                    </button>
                </div>

                <!-- Message Area -->
                <div ref="messageArea" class="flex-1 p-4 overflow-y-auto bg-gray-50/30 space-y-4 scroll-smooth">
                    <!-- Welcome Message if no messages -->
                    <div v-if="messages.length === 1 && !hasStarted" class="py-4 text-center">
                        <p class="text-xs text-gray-400 mb-4 px-8">เลือกหัวข้อที่คุณต้องการแจ้งแอดมิน หรือพิมพ์ข้อความด้านล่าง</p>
                        <div class="space-y-2 px-4">
                            <button @click="sendReport('Emergency')" class="w-full flex items-center justify-between px-4 py-3 text-xs font-semibold text-red-600 transition-all border border-red-100 rounded-xl bg-white hover:bg-red-50 shadow-sm active:scale-95">
                                <span>🚨 แจ้งเหตุการณ์ฉุกเฉิน</span>
                                <i class="fas fa-chevron-right text-[10px]"></i>
                            </button>
                            <button @click="sendReport('Urgent')" class="w-full flex items-center justify-between px-4 py-3 text-xs font-semibold text-amber-600 transition-all border border-amber-100 rounded-xl bg-white hover:bg-amber-50 shadow-sm active:scale-95">
                                <span>⚠️ แจ้งเรื่องด่วน/เหตุสุดวิสัย</span>
                                <i class="fas fa-chevron-right text-[10px]"></i>
                            </button>
                            <button @click="sendReport('General')" class="w-full flex items-center justify-between px-4 py-3 text-xs font-semibold text-blue-600 transition-all border border-blue-100 rounded-xl bg-white hover:bg-blue-50 shadow-sm active:scale-95">
                                <span>💬 แจ้งเรื่องทั่วไป</span>
                                <i class="fas fa-chevron-right text-[10px]"></i>
                            </button>
                        </div>
                    </div>

                    <div v-for="(msg, index) in messages" :key="index" :class="['flex', msg.role === 'user' ? 'justify-end' : 'justify-start']">
                        <div class="flex max-w-[85%] items-end gap-2" :class="msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'">
                            <div v-if="msg.role !== 'user'" class="flex-shrink-0 w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center text-[10px] text-white overflow-hidden shadow-sm">
                                 <i class="fas fa-headset"></i>
                            </div>
                            <div :class="['px-4 py-2.5 rounded-2xl text-sm shadow-sm transition-all', 
                                msg.role === 'user' ? 'bg-blue-600 text-white rounded-br-none' : 'bg-white text-gray-800 rounded-bl-none border border-gray-100']"
                            >
                                <div class="whitespace-pre-wrap leading-relaxed">{{ msg.text }}</div>
                                <div class="mt-1 text-[9px] opacity-50" :class="msg.role === 'user' ? 'text-right' : 'text-left'">
                                    {{ msg.time }}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="p-4 border-t border-gray-100 bg-white shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
                    <div class="flex items-center gap-2 bg-gray-50 p-1 rounded-2xl border border-gray-100 focus-within:border-blue-600 transition-colors">
                        <input 
                            v-model="newMessage" 
                            type="text" 
                            placeholder="พิมพ์ข้อความที่นี่..." 
                            class="flex-1 px-4 py-2.5 text-sm bg-transparent border-none outline-none"
                            @keyup.enter="sendMessage"
                        />
                        <button 
                            @click="sendMessage"
                            class="flex items-center justify-center w-10 h-10 text-white transition-all bg-blue-600 rounded-xl hover:bg-blue-700 disabled:opacity-20 disabled:cursor-not-allowed group"
                            :disabled="!newMessage.trim()"
                        >
                            <i class="fas fa-paper-plane text-sm group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform"></i>
                        </button>
                    </div>
                </div>
            </div>
        </transition>
    </div>
</template>

<script setup>
import { ref, nextTick, computed } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const isOpen = ref(false)
const hasNotification = ref(true)
const newMessage = ref('')
const messageArea = ref(null)
const hasStarted = ref(false)

const isAdminPage = computed(() => route.path.startsWith('/admin'))

const messages = ref([
    {
        role: 'admin',
        text: 'สวัสดีครับ ผมคือแอดมิน ยินดีให้บริการครับ\n\nท่านต้องการแจ้งเหตุการณ์ด่วน เหตุสุดวิสัย หรือมีเรื่องสอบถาม สามารถกดปุ่มด้านบนหรือพิมพ์บอกได้เลยครับ',
        time: getCurrentTime()
    }
])

function getCurrentTime() {
    return new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })
}

const toggleChat = () => {
    isOpen.value = !isOpen.value
    if (isOpen.value) {
        hasNotification.value = false
        scrollToBottom()
    }
}

const sendReport = (type) => {
    hasStarted.value = true
    let text = ''
    switch(type) {
        case 'Emergency': text = '🚨 แจ้งเหตุการณ์ฉุกเฉิน'; break;
        case 'Urgent': text = '⚠️ แจ้งเรื่องด่วน / เหตุสุดวิสัย'; break;
        case 'General': text = '💬 แจ้งเรื่องทั่วไป'; break;
    }
    
    messages.value.push({ role: 'user', text, time: getCurrentTime() })
    
    // Auto reply
    setTimeout(() => {
        let reply = ''
        if (type === 'Emergency') {
            reply = '🚨 รับทราบเหตุการณ์ฉุกเฉินครับ! กรุณาระบุสถานที่ และรายละเอียดเบื้องต้นโดยด่วนครับ ทีมงานกำลังเตรียมประสานงานช่วยเหลือครับ'
        } else if (type === 'Urgent') {
            reply = '⚠️ รับทราบเหตุการณ์ด่วนครับ รบกวนแจ้งรายละเอียดและเลขทะเบียนรถ/รหัสงาน ให้แอดมินตรวจสอบสักครู่ครับ'
        } else {
            reply = '💬 รับทราบครับ รบกวนแจ้งเรื่องที่ต้องการสอบถามได้เลยครับ แอดมินจะรีบตอบกลับโดยเร็วที่สุด'
        }
        
        messages.value.push({
            role: 'admin',
            text: reply,
            time: getCurrentTime()
        })
        scrollToBottom()
    }, 800)
    
    scrollToBottom()
}

const sendMessage = () => {
    if (!newMessage.value.trim()) return
    
    hasStarted.value = true
    messages.value.push({
        role: 'user',
        text: newMessage.value,
        time: getCurrentTime()
    })
    
    newMessage.value = ''
    scrollToBottom()
    
    // Mock admin response
    setTimeout(() => {
        messages.value.push({
            role: 'admin',
            text: 'รับทราบข้อมูลครับ แอดมินกำลังตรวจสอบและดำเนินการให้ครับ หากมีข้อมูลเพิ่มเติมจะรีบแจ้งกลับทันที',
            time: getCurrentTime()
        })
        scrollToBottom()
    }, 1500)
}

const scrollToBottom = () => {
    nextTick(() => {
        if (messageArea.value) {
            messageArea.value.scrollTop = messageArea.value.scrollHeight
        }
    })
}
</script>

<style scoped>
.fixed {
    transition: all 0.3s ease;
}

/* หากเป็นหน้า admin ให้ขยับขึ้นเล็กน้อยเพื่อไม่ให้บังปุ่มบันทึก/แก้ไข */
.fixed.right-admin {
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
