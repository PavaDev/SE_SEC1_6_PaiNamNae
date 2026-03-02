<script setup>
import { ref, onMounted } from 'vue'
import { useCookie } from '#app'

const config = useRuntimeConfig()
const API = config.public.apiBase
const tokenCookie = useCookie('token')

const notifications = ref([])
const loading = ref(false)
const selected = ref(null)

const formatDate = (date) => {
  if (!date) return '-'
  return new Date(date).toLocaleString('th-TH', {
    dateStyle: 'medium',
    timeStyle: 'short'
  })
}

const fetchNotifications = async () => {
  try {
    loading.value = true
    if (!tokenCookie.value) return

    const res = await fetch(`${API}/notifications?limit=100`, {
      headers: {
        Authorization: `Bearer ${tokenCookie.value}`
      }
    })

    if (!res.ok) {
      console.error('API Error:', res.status)
      return
    }

    const data = await res.json()
    notifications.value = data.data || data
  } catch (err) {
    console.error(err)
  } finally {
    loading.value = false
  }
}

const markAsRead = async (id) => {
  await fetch(`${API}/notifications/${id}/read`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${tokenCookie.value}`
    }
  })
  fetchNotifications()
}

onMounted(fetchNotifications)
</script>

<template>
  <div class="min-h-screen bg-gray-50 text-gray-900">

    <!-- Header -->
    <section class="relative px-4 pt-12 pb-6 mx-auto max-w-6xl">
      <h1 class="text-3xl font-extrabold sm:text-4xl">
        การแจ้งเตือน
      </h1>
      <p class="mt-2 text-gray-600">
        รายละเอียดการแจ้งเตือนทั้งหมดของคุณ
      </p>

      <button
        @click="fetchNotifications"
        class="mt-6 px-5 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
      >
        รีเฟรชรายการ
      </button>
    </section>

    <!-- List -->
    <section class="px-4 pb-16 mx-auto max-w-6xl">

      <div v-if="loading" class="py-10 text-center text-gray-500">
        กำลังโหลด...
      </div>

      <div v-else-if="notifications.length === 0"
           class="p-8 text-center bg-white border border-gray-200 rounded-xl">
        ยังไม่มีการแจ้งเตือน
      </div>

      <div v-else class="grid gap-6">

        <div
          v-for="n in notifications"
          :key="n.id"
          class="p-6 bg-white border border-gray-200 rounded-xl shadow-sm transition hover:shadow-md card"
          :class="!n.isRead ? 'border-blue-400 bg-blue-50/40' : ''"
        >

          <!-- Header -->
          <div class="flex items-start justify-between">
            <div>
              <h3 class="text-lg font-semibold">
                {{ n.title }}
              </h3>
              <p class="text-sm text-gray-500">
                {{ formatDate(n.createdAt) }}
              </p>
            </div>

            <span
              class="px-3 py-1 text-xs font-semibold rounded-full"
              :class="n.isRead
                ? 'bg-gray-200 text-gray-600'
                : 'bg-blue-100 text-blue-700'"
            >
              {{ n.isRead ? 'อ่านแล้ว' : 'ยังไม่อ่าน' }}
            </span>
          </div>

          <!-- Message -->
          <p class="mt-3 text-gray-700">
            {{ n.message }}
          </p>

          <!-- Extra info -->
          <div class="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-gray-600">
            <div><strong>ประเภท:</strong> {{ n.type || '-' }}</div>
            <div><strong>ID:</strong> {{ n.id }}</div>
            <div v-if="n.routeId"><strong>Route ID:</strong> {{ n.routeId }}</div>
            <div v-if="n.bookingId"><strong>Booking ID:</strong> {{ n.bookingId }}</div>
          </div>

          <!-- Actions -->
          <div class="flex justify-end gap-3 mt-4">
            <button
              v-if="!n.isRead"
              @click="markAsRead(n.id)"
              class="px-4 py-2 text-sm text-white bg-blue-600 rounded-md hover:bg-blue-700 transition"
            >
              ทำเครื่องหมายว่าอ่านแล้ว
            </button>

            <button
              @click="selected = n"
              class="px-4 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-100 transition"
            >
              ดูรายละเอียด
            </button>
          </div>

        </div>

      </div>

    </section>

    <!-- Modal -->
    <div
      v-if="selected"
      class="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50"
    >
      <div class="bg-white rounded-xl max-w-lg w-full p-6 shadow-lg">

        <h2 class="text-xl font-bold mb-2">
          {{ selected.title }}
        </h2>

        <p class="text-gray-500 text-sm mb-3">
          {{ formatDate(selected.createdAt) }}
        </p>

        <p class="mb-4 text-gray-700">
          {{ selected.message }}
        </p>

        <div class="text-sm text-gray-600 space-y-1">
          <div><strong>ID:</strong> {{ selected.id }}</div>
          <div><strong>ประเภท:</strong> {{ selected.type || '-' }}</div>
          <div v-if="selected.routeId"><strong>Route ID:</strong> {{ selected.routeId }}</div>
          <div v-if="selected.bookingId"><strong>Booking ID:</strong> {{ selected.bookingId }}</div>
        </div>

        <div class="text-right mt-6">
          <button
            @click="selected = null"
            class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
          >
            ปิด
          </button>
        </div>

      </div>
    </div>

  </div>
</template>

<style scoped>
.card {
  transition: all 0.3s ease;
}

.card:hover {
  transform: translateY(-3px);
  box-shadow: 0 12px 28px rgba(59, 130, 246, 0.15);
}
</style>