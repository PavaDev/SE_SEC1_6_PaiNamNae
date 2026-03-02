import { ref, watch } from 'vue'
import { useSocket } from './useSocket'
import { useAuth } from './useAuth'

const notifications = ref([])
const hasUnread = ref(false)
const initialized = ref(false)
const isOpen = ref(false)

export function useNotifications() {
    const { onEvent } = useSocket()
    const { user } = useAuth()

    const addNotification = (text, type = 'info') => {
        const time = new Date().toLocaleTimeString('th-TH', {
            hour: '2-digit',
            minute: '2-digit'
        })

        notifications.value.push({
            id: Date.now(),
            text,
            time,
            type,
            role: 'system'
        })

        hasUnread.value = true

        // Persist to localStorage for "entering again" requirement
        if (process.client && user.value) {
            localStorage.setItem(`notifications_${user.value.id}`, JSON.stringify(notifications.value))
            localStorage.setItem(`hasUnread_${user.value.id}`, 'true')
        }
    }

    const clearUnread = () => {
        hasUnread.value = false
        if (process.client && user.value) {
            localStorage.setItem(`hasUnread_${user.value.id}`, 'false')
        }
    }

    const init = () => {
        if (!process.client || !user.value || initialized.value) return
        initialized.value = true

        // Load from localStorage
        const saved = localStorage.getItem(`notifications_${user.value.id}`)
        if (saved) {
            try {
                notifications.value = JSON.parse(saved)
            } catch (e) {
                console.error('Failed to parse saved notifications', e)
            }
        }

        const unread = localStorage.getItem(`hasUnread_${user.value.id}`)
        hasUnread.value = unread === 'true'

        // Listen to events
        onEvent('booking:driverArriving', (data) => {
            addNotification(`คนขับใกล้ถึงแล้ว! อีกประมาณ ${data.minutes} นาที`, 'arrival')
        })

        onEvent('trip:started', (data) => {
            addNotification('การเดินทางเริ่มต้นขึ้นแล้ว ขอให้เดินทางโดยสวัสดิภาพ', 'status')
        })

        onEvent('booking:tripCompleted', (data) => {
            addNotification('การเดินทางสิ้นสุดลงแล้ว อย่าลืมให้คะแนนความประทับใจนะ', 'status')
        })

        onEvent('booking:passengerStatusChanged', (data) => {
            if (data.status === 'IN_TRANSIT') {
                addNotification('คุณเช็คอินเข้าสู่การเดินทางเรียบร้อยแล้ว', 'status')
            } else if (data.status === 'COMPLETED') {
                addNotification('คุณถึงที่หมายเรียบร้อยแล้ว ขอบคุณที่ใช้บริการ', 'status')
            }
        })

        onEvent('booking:statusChanged', (data) => {
            if (data.status === 'CONFIRMED') {
                addNotification('การจองของคุณได้รับการยืนยันแล้ว เตรียมตัวออกเดินทางกัน!', 'status')
            } else if (data.status === 'REJECTED') {
                addNotification('ขออภัย คำขอร่วมทริปของคุณถูกปฏิเสธ', 'danger')
            }
        })

        onEvent('booking:cancelled', (data) => {
            addNotification('ผู้โดยสารได้ยกเลิกการร่วมทริป', 'danger')
        })

        onEvent('booking:created', (data) => {
            addNotification('มีผู้โดยสารใหม่ขอร่วมทริปกับคุณ!', 'info')
        })
    }

    return {
        notifications,
        hasUnread,
        isOpen,
        addNotification,
        clearUnread,
        init
    }
}
