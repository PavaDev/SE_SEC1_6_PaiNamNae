import { io } from 'socket.io-client'
import { watch } from 'vue'
import { useCookie, useRuntimeConfig } from '#app'

export default defineNuxtPlugin(() => {
    const config = useRuntimeConfig()
    const apiBase = config.public.apiBase || 'http://localhost:3000/api/'

    // Derive the Socket.IO server URL from the API base
    // e.g. "http://localhost:3000/api/" → "http://localhost:3000"
    const serverUrl = apiBase.replace(/\/api\/?$/, '')

    const token = useCookie('token')

    const socket = io(serverUrl, {
        autoConnect: false,
        auth: {
            token: token.value || '',
        },
    })

    // Connect when token is available
    if (token.value) {
        socket.auth = { token: token.value }
        socket.connect()
    }

    // Watch for token changes (login/logout)
    watch(
        () => token.value,
        (newToken) => {
            if (newToken) {
                socket.auth = { token: newToken }
                socket.connect()
            } else {
                socket.disconnect()
            }
        }
    )

    socket.on('connect', () => {
        console.log('🔌 Socket.IO connected:', socket.id)
    })

    socket.on('connect_error', (err) => {
        console.warn('🔌 Socket.IO connection error:', err.message)
    })

    return { provide: { socket } }
})
