<template>
    <div class="flex h-[calc(100vh-64px)] bg-gray-50 overflow-hidden font-kanit">
        <!-- Sidebar: Chat List -->
        <div class="w-80 bg-white border-r border-gray-200 flex flex-col shrink-0">
            <div class="p-4 border-b border-gray-100 bg-white sticky top-0 z-10">
                <h2 class="text-xl font-bold text-gray-800">Support Chats</h2>
                <div class="mt-3 relative">
                    <input type="text" placeholder="Search chats..." class="w-full pl-9 pr-4 py-2 bg-gray-100 border-none rounded-lg text-sm focus:ring-2 focus:ring-blue-500">
                    <i class="fas fa-search absolute left-3 top-2.5 text-gray-400 text-xs"></i>
                </div>
            </div>

            <div class="flex-1 overflow-y-auto custom-scrollbar">
                <div 
                    v-for="chat in chatList" 
                    :key="chat.id"
                    @click="selectChat(chat)"
                    :class="['p-4 flex gap-3 cursor-pointer transition-colors border-b border-gray-50 hover:bg-gray-50', 
                             selectedChat?.id === chat.id ? 'bg-blue-50 hover:bg-blue-50 border-l-4 border-l-blue-600' : '']"
                >
                    <div class="relative flex-shrink-0">
                        <img :src="chat.avatar" class="w-12 h-12 rounded-xl object-cover shadow-sm">
                        <div v-if="chat.online" class="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-green-500 border-2 border-white rounded-full"></div>
                    </div>
                    <div class="flex-1 min-w-0">
                        <div class="flex justify-between items-start mb-1">
                            <h3 class="font-bold text-gray-900 truncate text-sm">{{ chat.name }}</h3>
                            <span class="text-[10px] text-gray-400 whitespace-nowrap">{{ chat.time }}</span>
                        </div>
                        <p class="text-xs text-gray-500 truncate leading-tight">{{ chat.lastMessage }}</p>
                        <div class="mt-2 flex items-center gap-2">
                            <span v-if="chat.unread" class="bg-blue-600 text-white text-[9px] px-1.5 py-0.5 rounded-full font-bold">New</span>
                            <span :class="['text-[9px] px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wider', chat.tagColor]">
                                {{ chat.tag }}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Main Chat Area -->
        <div v-if="selectedChat" class="flex-1 flex flex-col bg-white">
            <!-- Chat Header -->
            <div class="px-6 py-4 border-b border-gray-100 flex justify-between items-center shadow-sm">
                <div class="flex items-center gap-4">
                    <div class="relative">
                        <img :src="selectedChat.avatar" class="w-10 h-10 rounded-xl object-cover">
                        <div v-if="selectedChat.online" class="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
                    </div>
                    <div>
                        <h3 class="font-bold text-gray-900">{{ selectedChat.name }}</h3>
                        <p class="text-xs text-green-600 font-medium">Driver • {{ selectedChat.online ? 'Online' : 'Offline' }}</p>
                    </div>
                </div>
                <div class="flex gap-2">
                    <button class="w-10 h-10 flex items-center justify-center rounded-xl bg-gray-100 text-gray-500 hover:bg-gray-200 transition-colors">
                        <i class="fas fa-phone-alt text-sm"></i>
                    </button>
                    <button class="w-10 h-10 flex items-center justify-center rounded-xl bg-gray-100 text-gray-500 hover:bg-gray-200 transition-colors">
                        <i class="fas fa-info-circle text-sm"></i>
                    </button>
                    <button @click="selectedChat = null" class="lg:hidden w-10 h-10 flex items-center justify-center rounded-xl bg-gray-100 text-gray-500 hover:bg-gray-200 transition-colors">
                        <i class="fas fa-times text-sm"></i>
                    </button>
                </div>
            </div>

            <!-- Messages List -->
            <div class="flex-1 overflow-y-auto p-6 space-y-4 bg-[#F8FAFC] custom-scrollbar" ref="messageBox">
                <div v-for="(msg, index) in selectedChat.messages" :key="index" :class="['flex', msg.role === 'admin' ? 'justify-end' : 'justify-start']">
                    <div :class="['max-w-[70%] group relative', msg.role === 'admin' ? 'order-1' : 'order-2']">
                        <div :class="['px-4 py-3 rounded-2xl text-sm shadow-sm transition-all', 
                            msg.role === 'admin' ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-white text-gray-800 rounded-tl-none border border-gray-100']"
                        >
                            <p class="leading-relaxed">{{ msg.text }}</p>
                            <div class="mt-1.5 flex items-center gap-2 opacity-60 text-[10px]" :class="msg.role === 'admin' ? 'justify-end' : 'justify-start'">
                                <span>{{ msg.time }}</span>
                                <i v-if="msg.role === 'admin'" class="fas fa-check-double text-[8px]"></i>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Chat Input -->
            <div class="p-4 bg-white border-t border-gray-100">
                <div class="max-w-4xl mx-auto flex items-end gap-3 bg-gray-50 p-2 rounded-2xl border border-gray-200 focus-within:border-blue-600 transition-all shadow-sm">
                    <button class="w-10 h-10 flex items-center justify-center text-gray-400 hover:text-blue-600 transition-colors">
                        <i class="fas fa-paperclip"></i>
                    </button>
                    <textarea 
                        v-model="replyText" 
                        placeholder="Type your reply here..." 
                        class="flex-1 bg-transparent border-none outline-none text-sm py-2 px-1 min-h-[40px] max-h-32 resize-none overflow-y-auto"
                        @keyup.enter.exact.prevent="sendReply"
                        rows="1"
                    ></textarea>
                    <button 
                        @click="sendReply"
                        class="w-10 h-10 bg-blue-600 text-white rounded-xl shadow-lg shadow-blue-200 hover:bg-blue-700 active:scale-95 transition-all flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed group"
                        :disabled="!replyText.trim()"
                    >
                        <i class="fas fa-paper-plane text-sm group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform"></i>
                    </button>
                </div>
            </div>
        </div>

        <!-- Empty State -->
        <div v-else class="flex-1 flex flex-col items-center justify-center bg-white text-center p-12">
            <div class="w-24 h-24 bg-blue-50 rounded-full flex items-center justify-center mb-6">
                <i class="fas fa-comments text-4xl text-blue-600 animate-bounce"></i>
            </div>
            <h2 class="text-2xl font-bold text-gray-900 mb-2">Select a chat to start responding</h2>
            <p class="text-gray-500 max-w-sm">Choose a conversation from the sidebar to view reports and chat with drivers in real-time.</p>
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted, nextTick } from 'vue'

definePageMeta({
    layout: 'admin' // If you have an admin layout, use it. Otherwise it will use default.
})

const replyText = ref('')
const messageBox = ref(null)

const chatList = ref([
    {
        id: 1,
        name: 'Phropaki Kilmongo',
        avatar: 'https://ui-avatars.com/api/?name=PK&background=0D8ABC&color=fff',
        online: true,
        lastMessage: 'I have an issue with the route to Chiang Mai.',
        time: '2m ago',
        unread: true,
        tag: 'Urgent',
        tagColor: 'bg-red-100 text-red-600',
        messages: [
            { role: 'user', text: 'Hello Admin, I have an issue with the route to Chiang Mai.', time: '10:30 AM' },
            { role: 'admin', text: 'Hi! Could you please specify the issue?', time: '10:32 AM' },
            { role: 'user', text: 'The road is currently blocked due to an accident.', time: '10:35 AM' },
        ]
    },
    {
        id: 2,
        name: 'Pan Anban',
        avatar: 'https://ui-avatars.com/api/?name=PA&background=6B7280&color=fff',
        online: false,
        lastMessage: 'The passenger is late for 15 minutes.',
        time: '1h ago',
        unread: false,
        tag: 'General',
        tagColor: 'bg-green-100 text-green-600',
        messages: [
            { role: 'user', text: 'The passenger is late for 15 minutes.', time: '09:15 AM' },
            { role: 'admin', text: 'Understood. We will contact them.', time: '09:20 AM' },
        ]
    }
])

const selectedChat = ref(null)

function selectChat(chat) {
    selectedChat.value = chat
    chat.unread = false
    scrollToBottom()
}

function sendReply() {
    if (!replyText.value.trim() || !selectedChat.value) return
    
    selectedChat.value.messages.push({
        role: 'admin',
        text: replyText.value,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    })
    
    selectedChat.value.lastMessage = replyText.value
    replyText.value = ''
    scrollToBottom()
}

function scrollToBottom() {
    nextTick(() => {
        if (messageBox.value) {
            messageBox.value.scrollTop = messageBox.value.scrollHeight
        }
    })
}

onMounted(() => {
    // Optionally select the first chat
    // if (chatList.value.length > 0) selectChat(chatList.value[0])
})
</script>

<style scoped>
.font-kanit {
    font-family: 'Kanit', sans-serif;
}

.custom-scrollbar::-webkit-scrollbar {
    width: 5px;
}
.custom-scrollbar::-webkit-scrollbar-track {
    background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
    background: #E2E8F0;
    border-radius: 10px;
}
.custom-scrollbar::-webkit-scrollbar-thumb:hover {
    background: #CBD5E1;
}

@keyframes bounce {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-5px); }
}
.animate-bounce {
    animation: bounce 2s infinite ease-in-out;
}
</style>
