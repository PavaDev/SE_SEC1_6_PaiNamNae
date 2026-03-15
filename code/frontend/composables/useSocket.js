import { onUnmounted } from 'vue'

/**
 * Composable for Socket.IO integration.
 * Provides helpers to join/leave rooms, listen to events, and auto-cleanup on unmount.
 * All methods are null-safe: they silently no-op if the socket is not yet available.
 */
export function useSocket() {
    const nuxtApp = useNuxtApp()
    const _listeners = []

    /** Get the socket instance (may be undefined if plugin hasn't loaded or no token) */
    function getSocket() {
        return nuxtApp.$socket
    }

    /**
     * Listen to a socket event. Auto-cleaned up on component unmount.
     */
    function onEvent(event, callback) {
        const s = getSocket()
        if (!s) return
        s.on(event, callback)
        _listeners.push({ event, callback })
    }

    /**
     * Stop listening to a socket event.
     */
    function offEvent(event, callback) {
        const s = getSocket()
        if (s) s.off(event, callback)
        const idx = _listeners.findIndex(l => l.event === event && l.callback === callback)
        if (idx > -1) _listeners.splice(idx, 1)
    }

    /**
     * Emit a socket event to the server.
     */
    function emit(event, ...args) {
        const s = getSocket()
        if (s) s.emit(event, ...args)
    }

    /**
     * Join a Socket.IO room (server-side).
     */
    function joinRoom(room) {
        const s = getSocket()
        if (s) s.emit(`join-${room}`)
    }

    /**
     * Leave a Socket.IO room.
     */
    function leaveRoom(room) {
        const s = getSocket()
        if (s) s.emit(`leave-${room}`)
    }

    /**
     * Cleanup all registered listeners on unmount.
     */
    function cleanup() {
        const s = getSocket()
        if (s) {
            for (const { event, callback } of _listeners) {
                s.off(event, callback)
            }
        }
        _listeners.length = 0
    }

    onUnmounted(() => {
        cleanup()
    })

    return {
        socket: getSocket(),
        onEvent,
        offEvent,
        emit,
        joinRoom,
        leaveRoom,
        cleanup,
    }
}

