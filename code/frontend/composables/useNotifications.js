import { ref } from 'vue'
import { useSocket } from './useSocket'
import { useAuth } from './useAuth'

const notifications = ref([])
const hasUnread = ref(false)
const initialized = ref(false)
const isOpen = ref(false)

export function useNotifications() {
    const { onEvent } = useSocket()
    const { user } = useAuth()

    const addNotification = (text, type = 'info', isClickable = false, skipPersist = false) => {
        const time = new Date().toLocaleTimeString('th-TH', {
            hour: '2-digit',
            minute: '2-digit'
        })

        const displayText = isClickable ? `${text} (กดไปดู)` : text

        notifications.value.push({
            id: Date.now(),
            text: displayText,
            time,
            type,
            isClickable,
            role: 'system'
        })

        if (!skipPersist) {
            hasUnread.value = true
            if (process.client && user.value) {
                localStorage.setItem(`notifications_${user.value.id}`, JSON.stringify(notifications.value))
                localStorage.setItem(`hasUnread_${user.value.id}`, 'true')
            }
        }
    }

    const clearUnread = () => {
        hasUnread.value = false
        if (process.client && user.value) {
            localStorage.setItem(`hasUnread_${user.value.id}`, 'false')
        }
    }

    const resetChat = () => {
        notifications.value = []
        hasUnread.value = false
        if (process.client && user.value) {
            localStorage.removeItem(`notifications_${user.value.id}`)
            localStorage.setItem(`hasUnread_${user.value.id}`, 'false')
        }
    }

    const fetchPersistedNotifications = async () => {
        try {
            const apiBase = useRuntimeConfig().public.apiBase || 'http://localhost:3000/api'
            const tk = useCookie('token')?.value || (process.client ? localStorage.getItem('token') : '')
            if (!tk) return

            const res = await $fetch('/notifications', {
                baseURL: apiBase,
                headers: { Accept: 'application/json', Authorization: `Bearer ${tk}` },
                query: { page: 1, limit: 10 }
            })

            const raw = Array.isArray(res?.data) ? res.data : []
            // Filter only trip-related ones and add them if not already in list
            const tripRelated = raw.filter(it =>
                it.type === 'BOOKING' || it.kind === 'ROUTE_COMPLETED' || it.kind === 'ARRIVAL_NOTIFICATION'
            ).reverse() // Oldest first for chat flow

            tripRelated.forEach(it => {
                const alreadyExists = notifications.value.some(n => n.text.includes(it.body || it.title))
                if (!alreadyExists) {
                    addNotification(it.body || it.title, 'status', true, true)
                }
            })
        } catch (e) {
            console.error('Failed to sync persistent notifications', e)
        }
    }

    const init = () => {
        if (!process.client || !user.value || initialized.value) return
        initialized.value = true

        const saved = localStorage.getItem(`notifications_${user.value.id}`)
        if (saved) {
            try {
                notifications.value = JSON.parse(saved)
            } catch (e) {
                console.error('Failed to parse saved notifications', e)
            }
        } else {
            // First time or empty? Try to sync from DB for experience consistency
            fetchPersistedNotifications()
        }

        const unread = localStorage.getItem(`hasUnread_${user.value.id}`)
        hasUnread.value = unread === 'true'

        // --- Event Listeners ---

        onEvent('booking:driverArriving', (data) => {
            addNotification(`คนขับใกล้ถึงแล้ว! อีกประมาณ ${data.minutes} นาที`, 'arrival', true)
        })

        onEvent('trip:started', () => {
            addNotification('การเดินทางเริ่มต้นขึ้นแล้ว ขอให้เดินทางโดยสวัสดิภาพ', 'status', true)
        })

        onEvent('booking:tripCompleted', () => {
            const msg = 'การเดินทางสิ้นสุดลงแล้ว อย่าลืมให้คะแนนความประทับใจนะ'
            const alreadyExists = notifications.value.some(n => n.text.includes(msg))
            if (!alreadyExists) {
                addNotification(msg, 'status', true)
            }
        })

        onEvent('booking:passengerStatusChanged', (data) => {
            if (data.status === 'IN_TRANSIT') {
                addNotification('คุณเช็คอินเข้าสู่การเดินทางเรียบร้อยแล้ว', 'status', true)
            } else if (data.status === 'COMPLETED') {
                const msg = 'คุณถึงที่หมายเรียบร้อยแล้ว ขอบคุณที่ใช้บริการ'
                const alreadyExists = notifications.value.some(n => n.text.includes(msg))
                if (!alreadyExists) {
                    addNotification(msg, 'status', true)
                }
            }
        })

        onEvent('booking:statusChanged', (data) => {
            if (data.status === 'CONFIRMED') {
                addNotification('การจองของคุณได้รับการยืนยันแล้ว เตรียมตัวออกเดินทางกัน!', 'status', true)
            } else if (data.status === 'REJECTED') {
                addNotification('ขออภัย คำขอร่วมทริปของคุณถูกปฏิเสธ', 'danger')
            } else if (data.status === 'CANCELLED') {
                addNotification('การร่วมทริปถูกยกเลิก', 'danger')
            }
        })

        onEvent('booking:cancelled', () => {
            addNotification('มีการยกเลิกการเดินทาง', 'danger')
            setTimeout(() => resetChat(), 5000)
        })

        onEvent('booking:created', (data) => {
            addNotification('มีผู้โดยสารใหม่ขอร่วมทริปกับคุณ!', 'info', true)
        })

        onEvent('notification:new', (data) => {
            if (data.type === 'BOOKING' || data.kind === 'ARRIVAL_NOTIFICATION' || data.kind === 'ROUTE_COMPLETED') {
                const msg = data.body || data.message || 'มีการอัปเดตสถานะการเดินทาง'
                // Avoid double posting if specific event already handled it
                const alreadyExists = notifications.value.some(n => n.text.includes(msg))
                if (!alreadyExists) {
                    addNotification(msg, 'info', true)
                }

                if (data.kind === 'ROUTE_COMPLETED') {
                    setTimeout(() => resetChat(), 20000)
                }
            }
        })
    }

    return {
        notifications,
        hasUnread,
        isOpen,
        addNotification,
        clearUnread,
        resetChat,
        init,
        fetchPersistedNotifications
    }
}
