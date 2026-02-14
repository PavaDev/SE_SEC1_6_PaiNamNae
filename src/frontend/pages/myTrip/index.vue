<template>
    <div>
        <div class="px-4 py-8 mx-auto max-w-7xl sm:px-6 lg:px-8">
            <div class="mb-8">
                <h2 class="text-2xl font-bold text-gray-900">การเดินทางของฉัน</h2>
                <p class="mt-2 text-gray-600">จัดการและติดตามการเดินทางทั้งหมดของคุณ</p>
            </div>

            <div class="p-6 mb-8 bg-white border border-gray-300 rounded-lg shadow-md">
                <div class="flex flex-wrap gap-2">
                    <button v-for="tab in tabs" :key="tab.status" @click="activeTab = tab.status"
                        :class="['tab-button px-4 py-2 rounded-md font-medium', { 'active': activeTab === tab.status }]">
                        {{ tab.label }} ({{ getTripCount(tab.status) }})
                    </button>
                </div>
            </div>

            <div class="grid grid-cols-1 gap-6 lg:grid-cols-3">
                <div class="lg:col-span-2">
                    <div class="bg-white border border-gray-300 rounded-lg shadow-md">
                        <div class="p-6 border-b border-gray-300">
                            <h3 class="text-lg font-semibold text-gray-900">รายการการเดินทาง</h3>
                        </div>

                        <div v-if="isLoading" class="p-12 text-center text-gray-500">
                            <p>กำลังโหลดข้อมูลการเดินทาง...</p>
                        </div>

                        <div v-else class="divide-y divide-gray-200">
                            <div v-if="filteredTrips.length === 0" class="p-12 text-center text-gray-500">
                                <p>ไม่พบรายการเดินทางในหมวดหมู่นี้</p>
                            </div>

                            <div v-for="trip in filteredTrips" :key="trip.id"
                                class="p-6 transition-colors duration-200 cursor-pointer trip-card hover:bg-gray-50"
                                @click="toggleTripDetails(trip.id)">
                                <div class="flex items-start justify-between mb-4">
                                    <div class="flex-1">
                                        <div class="flex items-center justify-between">
                                            <h4 class="text-lg font-semibold text-gray-900">
                                                {{ trip.origin }} → {{ trip.destination }}
                                            </h4>
                                            <span v-if="trip.status === 'pending'"
                                                class="status-badge status-pending">รอดำเนินการ</span>
                                            <span v-else-if="trip.status === 'confirmed'"
                                                class="status-badge status-confirmed">ยืนยันแล้ว</span>
                                            <span v-else-if="trip.status === 'rejected'"
                                                class="status-badge status-rejected">ปฏิเสธ</span>
                                            <span v-else-if="trip.status === 'cancelled'"
                                                class="status-badge status-cancelled">ยกเลิก</span>
                                            <span v-else-if="trip.status === 'completed'"
                                                class="status-badge status-completed">เสร็จสิ้น</span>
                                        </div>
                                        <p class="mt-1 text-sm text-gray-600">จุดนัดพบ: {{ trip.pickupPoint }}</p>
                                        <p class="text-sm text-gray-600">
                                            วันที่: {{ trip.date }}
                                            <span class="mx-2 text-gray-300">|</span>
                                            เวลา: {{ trip.time }}
                                            <span class="mx-2 text-gray-300">|</span>
                                            ระยะเวลา: {{ trip.durationText }}
                                            <span class="mx-2 text-gray-300">|</span>
                                            ระยะทาง: {{ trip.distanceText }}
                                        </p>
                                    </div>
                                </div>

                                <div class="flex items-center mb-4 space-x-4">
                                    <img :src="trip.driver.image" :alt="trip.driver.name"
                                        class="object-cover w-12 h-12 rounded-full" />
                                    <div class="flex-1">
                                        <h5 class="font-medium text-gray-900">{{ trip.driver.name }}</h5>
                                        <div class="flex items-center">
                                            <div class="flex text-sm text-yellow-400">
                                                <span>
                                                    {{ '★'.repeat(Math.round(trip.driver.rating)) }}{{ '☆'.repeat(5 -
                                                        Math.round(trip.driver.rating)) }}
                                                </span>
                                            </div>
                                            <span class="ml-2 text-sm text-gray-600">{{ trip.driver.rating }} ({{
                                                trip.driver.reviews }} รีวิว)</span>
                                        </div>
                                    </div>
                                    <div class="text-right">
                                        <div class="text-lg font-bold text-blue-600">{{ trip.price }} บาท</div>
                                        <div class="text-sm text-gray-600">จำนวน {{ trip.seats }} ที่นั่ง</div>
                                    </div>
                                </div>

                                <div v-if="selectedTripId === trip.id"
                                    class="pt-4 mt-4 mb-5 duration-300 border-t border-gray-300 animate-in slide-in-from-top">
                                    <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
                                        <div>
                                            <h5 class="mb-2 font-medium text-gray-900">รายละเอียดเส้นทาง</h5>
                                            <ul class="space-y-1 text-sm text-gray-600">
                                                <li>
                                                    • จุดเริ่มต้น:
                                                    <span class="font-medium text-gray-900">{{ trip.origin }}</span>
                                                    <span v-if="trip.originAddress"> — {{ trip.originAddress }}</span>
                                                </li>

                                                <template v-if="trip.stops && trip.stops.length">
                                                    <li class="mt-2 text-gray-700">• จุดแวะระหว่างทาง ({{
                                                        trip.stops.length }} จุด):</li>
                                                    <li v-for="(stop, idx) in trip.stops" :key="idx">  - จุดแวะ {{ idx +
                                                        1 }}: {{ stop }}</li>
                                                </template>

                                                <li class="mt-1">
                                                    • จุดปลายทาง:
                                                    <span class="font-medium text-gray-900">{{ trip.destination
                                                    }}</span>
                                                    <span v-if="trip.destinationAddress"> — {{ trip.destinationAddress
                                                    }}</span>
                                                </li>
                                            </ul>
                                        </div>
                                        <div>
                                            <h5 class="mb-2 font-medium text-gray-900">รายละเอียดรถ</h5>
                                            <ul class="space-y-1 text-sm text-gray-600">
                                                <li v-for="detail in trip.carDetails" :key="detail">• {{ detail }}</li>
                                            </ul>
                                        </div>
                                    </div>

                                    <div class="mt-4 space-y-4">
                                        <div v-if="trip.conditions">
                                            <h5 class="mb-2 font-medium text-gray-900">เงื่อนไขการเดินทาง</h5>
                                            <p
                                                class="p-3 text-sm text-gray-700 border border-gray-300 rounded-md bg-gray-50">
                                                {{ trip.conditions }}
                                            </p>
                                        </div>

                                        <div v-if="trip.photos && trip.photos.length > 0">
                                            <h5 class="mb-2 font-medium text-gray-900">รูปภาพรถยนต์</h5>
                                            <div class="grid grid-cols-3 gap-2 mt-2">
                                                <div v-for="(photo, index) in trip.photos.slice(0, 3)" :key="index">
                                                    <img :src="photo" alt="Vehicle photo"
                                                        class="object-cover w-full transition-opacity rounded-lg shadow-sm cursor-pointer aspect-video hover:opacity-90" />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div class="flex justify-end space-x-3" :class="{ 'mt-4': selectedTripId !== trip.id }">
                                    <!-- ALL TAB: แสดงเฉพาะปุ่มรีวิวและรายงาน -->
                                    <template v-if="activeTab === 'all'">
                                        <button
                                            @click.stop="!trip.hasReview && openReviewModal(trip)"
                                            :disabled="trip.hasReview"
                                            class="px-4 py-2 text-sm text-white transition duration-200 rounded-md"
                                            :class="trip.hasReview
                                                ? 'bg-gray-400 cursor-not-allowed'
                                                : 'bg-blue-600 hover:bg-blue-700'"
                                        >
                                        {{ trip.hasReview ? 'รีวิวแล้ว' : 'รีวิว' }}
                                        </button>
                                        <button @click.stop="openReportModal(trip)"
                                            class="px-4 py-2 ml-2 text-sm text-white transition duration-200 bg-red-600 rounded-md hover:bg-red-700">
                                            รายงาน
                                        </button>
                                    </template>

                                    <!-- กรณีอื่น ๆ: แสดงปุ่มตามสถานะ -->
                                    <template v-else>
                                        <!-- PENDING: ยกเลิกได้ -->
                                        <button v-if="trip.status === 'pending'" @click.stop="openCancelModal(trip)"
                                            class="px-4 py-2 text-sm text-red-600 transition duration-200 border border-red-300 rounded-md hover:bg-red-50">
                                            ยกเลิกการจอง
                                        </button>

                                        <!-- CONFIRMED: เพิ่มปุ่มยกเลิก + คงปุ่มแชท -->
                                        <template v-else-if="trip.status === 'confirmed'">
                                            <button @click.stop="openCancelModal(trip)"
                                                class="px-4 py-2 text-sm text-red-600 transition duration-200 border border-red-300 rounded-md hover:bg-red-50">
                                                ยกเลิกการจอง
                                            </button>
                                            <button
                                                class="px-4 py-2 text-sm text-white transition duration-200 bg-blue-600 rounded-md hover:bg-blue-700">
                                                แชทกับผู้ขับ
                                            </button>
                                        </template>

                                        <!-- REJECTED / CANCELLED: ลบได้ -->
                                        <button v-else-if="['rejected', 'cancelled'].includes(trip.status)"
                                            @click.stop="openConfirmModal(trip, 'delete')"
                                            class="px-4 py-2 text-sm text-gray-600 transition duration-200 border border-gray-300 rounded-md hover:bg-gray-50">
                                            ลบรายการ
                                        </button>

                                        <!-- COMPLETED: แสดงปุ่มรีวิวและรายงาน -->
                                        <template v-else-if="trip.status === 'completed'">
                                           
                                        </template>

                                        <!-- ปุ่มสำหรับ DRIVER: กดจบงาน (แสดงเฉพาะถ้าเป็นคนขับและสถานะ confirmed/pending) -->
                                        <button
                                            v-if="isDriver(trip) && ['confirmed', 'pending'].includes(trip.status)"
                                            @click.stop="openConfirmModal(trip, 'complete')"
                                            class="px-4 py-2 ml-2 text-sm text-white transition duration-200 bg-green-600 rounded-md hover:bg-green-700">
                                            โปรดทราบ: ฉันคือคนขับ
                                        </button>
                                    </template>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="lg:col-span-1">
                    <div class="sticky overflow-hidden bg-white border border-gray-300 rounded-lg shadow-md top-8">
                        <div class="p-6 border-b border-gray-300">
                            <h3 class="text-lg font-semibold text-gray-900">แผนที่เส้นทาง</h3>
                        </div>
                        <div ref="mapContainer" id="map" class="h-96"></div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Modal: เลือกเหตุผลการยกเลิก -->
        <div v-if="isCancelModalVisible" class="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
            @click.self="closeCancelModal">
            <div class="w-full max-w-md p-6 bg-white rounded-lg shadow-xl">
                <h3 class="text-lg font-semibold text-gray-900">เลือกเหตุผลการยกเลิก</h3>
                <p class="mt-1 text-sm text-gray-600">โปรดเลือกเหตุผลตามตัวเลือกที่กำหนด</p>

                <div class="mt-4">
                    <label class="block mb-1 text-sm text-gray-700">เหตุผล</label>
                    <select v-model="selectedCancelReason" class="w-full px-3 py-2 border border-gray-300 rounded-md">
                        <option value="" disabled>-- เลือกเหตุผล --</option>
                        <option v-for="r in cancelReasonOptions" :key="r.value" :value="r.value">
                            {{ r.label }}
                        </option>
                    </select>
                    <p v-if="cancelReasonError" class="mt-2 text-sm text-red-600">
                        {{ cancelReasonError }}
                    </p>
                </div>

                <div class="flex justify-end gap-2 mt-6">
                    <button @click="closeCancelModal"
                        class="px-4 py-2 text-sm text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200">
                        ปิด
                    </button>
                    <button @click="submitCancel" :disabled="!selectedCancelReason || isSubmittingCancel"
                        class="px-4 py-2 text-sm text-white bg-red-600 rounded-md hover:bg-red-700 disabled:opacity-50">
                        {{ isSubmittingCancel ? 'กำลังส่ง...' : 'ยืนยันการยกเลิก' }}
                    </button>
                </div>
            </div>
        </div>

        <ConfirmModal :show="isModalVisible" :title="modalContent.title" :message="modalContent.message"
            :confirmText="modalContent.confirmText" :variant="modalContent.variant" @confirm="handleConfirmAction"
            @cancel="closeConfirmModal" />

        <!-- Review Modal -->
        <transition name="modal-fade">
            <div v-if="showReviewModal && reviewTrip" class="fixed inset-0 z-50 flex items-center justify-center bg-black/40" @click.self="closeReviewModal">
                <div class="w-full max-w-md p-6 bg-white rounded-lg shadow-xl">
                    <div class="flex items-center justify-between mb-4">
                        <h3 class="text-lg font-semibold text-gray-900">รีวิว {{ reviewTrip.driver.name }}</h3>
                        <button @click="closeReviewModal" class="text-gray-400 hover:text-gray-600">
                            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    <div class="space-y-4">
                        <div>
                            <label class="block mb-2 text-sm font-medium text-gray-700">ให้คะแนน</label>
                            <div class="flex items-center space-x-2 text-2xl text-yellow-400">
                                <button v-for="s in 5" :key="s" type="button" @click="reviewRating = s" class="focus:outline-none">
                                    <span>{{ s <= reviewRating ? '★' : '☆' }}</span>
                                </button>
                            </div>
                        </div>

                        <div>
                            <label class="block mb-2 text-sm font-medium text-gray-700">รีวิว</label>
                            <textarea v-model="reviewText" rows="4" placeholder="เขียนรีวิวให้ผู้ขับ..." class="w-full p-3 text-sm text-gray-900 border border-gray-300 rounded-md bg-white"></textarea>
                        </div>

                        <div>
                            <label class="block mb-2 text-sm font-medium text-gray-700">รูปประกอบ (สูงสุด 2 รูป)</label>
                            <div class="flex items-center gap-3">
                                <div class="flex space-x-2">
                                    <div v-for="(img, idx) in reviewImages" :key="idx" class="relative">
                                        <img :src="img.url" class="object-cover w-20 h-14 rounded-md border">
                                        <button type="button" @click="removeReviewImage(idx)" class="absolute top-0 right-0 px-1 text-white bg-red-500 rounded-full">×</button>
                                    </div>
                                </div>
                                <div>
                                    <input type="file" accept="image/*" @change="handleReviewFiles" :disabled="reviewImages.length >= 2" />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="flex items-center justify-end gap-2 mt-6">
                        <button @click="closeReviewModal" class="px-4 py-2 text-sm text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200">ยกเลิก</button>
                        <button @click="submitReview" :disabled="!reviewText && reviewImages.length === 0" class="px-4 py-2 text-sm text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:bg-gray-400">ส่งรีวิว</button>
                    </div>
                </div>
            </div>
        </transition>

        <!-- Report Modal -->
        <transition name="modal-fade">
            <div v-if="showReportModal && reportTrip" class="fixed inset-0 z-50 flex items-center justify-center bg-black/40" @click.self="closeReportModal">
                <div class="w-full max-w-md p-6 bg-white rounded-lg shadow-xl">
                    <div class="flex items-center justify-between mb-4">
                        <h3 class="text-lg font-semibold text-gray-900">รายงาน {{ reportTrip.driver.name }}</h3>
                        <button @click="closeReportModal" class="text-gray-400 hover:text-gray-600">
                            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    <div class="space-y-4">
                        <div>
                            <label class="block mb-2 text-sm font-medium text-gray-700">เหตุผลการรายงาน</label>
                            <textarea v-model="reportText" rows="4" placeholder="อธิบายปัญหาหรือเหตุผล..." class="w-full p-3 text-sm text-gray-900 border border-gray-300 rounded-md bg-white"></textarea>
                        </div>

                        <div>
                            <label class="block mb-2 text-sm font-medium text-gray-700">รูปประกอบ (สูงสุด 2 รูป)</label>
                            <div class="flex items-center gap-3">
                                <div class="flex space-x-2">
                                    <div v-for="(img, idx) in reportImages" :key="idx" class="relative">
                                        <img :src="img.url" class="object-cover w-20 h-14 rounded-md border">
                                        <button type="button" @click="removeReportImage(idx)" class="absolute top-0 right-0 px-1 text-white bg-red-500 rounded-full">×</button>
                                    </div>
                                </div>
                                <div>
                                    <input type="file" accept="image/*" @change="handleReportFiles" :disabled="reportImages.length >= 2" />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="flex items-center justify-end gap-2 mt-6">
                        <button @click="closeReportModal" class="px-4 py-2 text-sm text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200">ยกเลิก</button>
                        <button @click="submitReport" :disabled="!reportText && reportImages.length === 0" class="px-4 py-2 text-sm text-white bg-red-600 rounded-md hover:bg-red-700 disabled:bg-gray-400">ส่งรายงาน</button>
                    </div>
                </div>
            </div>
        </transition>
    </div>
</template>

<script setup>
import { ref, computed, onMounted, watch, nextTick } from 'vue'
import dayjs from 'dayjs'
import 'dayjs/locale/th'
import buddhistEra from 'dayjs/plugin/buddhistEra'
import ConfirmModal from '~/components/ConfirmModal.vue'
import { useToast } from '~/composables/useToast'

// Setup dayjs for Thai locale
dayjs.locale('th')
dayjs.extend(buddhistEra)

const { $api } = useNuxtApp()
const { toast } = useToast()
const { user } = useAuth() // ใช้ useAuth() ที่มีอยู่จริงในโปรเจค


// --- State Management ---
const activeTab = ref('pending')
const selectedTripId = ref(null)
const isLoading = ref(false)
const mapContainer = ref(null)
let map = null
let currentPolyline = null
let currentMarkers = []
const allTrips = ref([])
const canReview = ref(true)

let gmap = null // Google Map instance
let activePolyline = null
let startMarker = null
let endMarker = null
let geocoder = null
let placesService = null
const mapReady = ref(false)
let stopMarkers = []

const GMAPS_CB = '__gmapsReady__'

const tabs = [
    { status: 'pending', label: 'รอดำเนินการ' },
    { status: 'confirmed', label: 'ยืนยันแล้ว' },
    { status: 'rejected', label: 'ปฏิเสธ' },
    { status: 'cancelled', label: 'ยกเลิก' },
    { status: 'completed', label: 'เสร็จสิ้น' },
    { status: 'all', label: 'ทั้งหมด' }
]

definePageMeta({ middleware: 'auth' })

const cancelReasonOptions = [
    { value: 'CHANGE_OF_PLAN', label: 'เปลี่ยนแผน/มีธุระกะทันหัน' },
    { value: 'FOUND_ALTERNATIVE', label: 'พบวิธีเดินทางอื่นแล้ว' },
    { value: 'DRIVER_DELAY', label: 'คนขับล่าช้าหรือเลื่อนเวลา' },
    { value: 'PRICE_ISSUE', label: 'ราคาหรือค่าใช้จ่ายไม่เหมาะสม' },
    { value: 'WRONG_LOCATION', label: 'เลือกจุดรับ–ส่งผิด' },
    { value: 'DUPLICATE_OR_WRONG_DATE', label: 'จองซ้ำหรือจองผิดวัน' },
    { value: 'SAFETY_CONCERN', label: 'กังวลด้านความปลอดภัย' },
    { value: 'WEATHER_OR_FORCE_MAJEURE', label: 'สภาพอากาศ/เหตุสุดวิสัย' },
    { value: 'COMMUNICATION_ISSUE', label: 'สื่อสารไม่สะดวก/ติดต่อไม่ได้' }
]

const isCancelModalVisible = ref(false)
const isSubmittingCancel = ref(false)
const selectedCancelReason = ref('')
const cancelReasonError = ref('')
const tripToCancel = ref(null)

// --- Computed Properties ---
const filteredTrips = computed(() => {
    if (activeTab.value === 'all') return allTrips.value
    
    const filtered = allTrips.value.filter((trip) => trip.status === activeTab.value)

    // ถ้าเป็นแท็บ "เสร็จสิ้น" ให้กรอง routeId ซ้ำออก (กรณีจองหลายครั้งใน route เดียว)
    if (activeTab.value === 'completed') {
        const seen = new Set()
        return filtered.filter(trip => {
            if (seen.has(trip.routeId)) return false
            seen.add(trip.routeId)
            return true
        })
    }

    return filtered
})

const selectedTrip = computed(() => {
    return allTrips.value.find((trip) => trip.id === selectedTripId.value) || null
})

function cleanAddr(a) {
    return (a || '')
        .replace(/,?\s*(Thailand|ไทย|ประเทศ)\s*$/i, '')
        .replace(/\s{2,}/g, ' ')
        .trim()
}

const isDriver = (trip) => {
    return user.value && trip.driver.id === user.value.id
}

// --- Methods ---
async function fetchMyTrips() {
    isLoading.value = true
    try {
        const bookings = await $api('/bookings/me')

        // map ข้อมูลพื้นฐานก่อน (ตั้งชื่อชั่วคราวเป็นพิกัด แล้วไป reverse geocode ภายหลัง)
        const formatted = bookings.map((b) => {
            const driverData = {
                name: `${b.route.driver.firstName} ${b.route.driver.lastName}`.trim(),
                image:
                    b.route.driver.profilePicture ||
                    `https://ui-avatars.com/api/?name=${encodeURIComponent(b.route.driver.firstName || 'U')}&background=random&size=64`,
                rating: 4.5,
                reviews: Math.floor(Math.random() * 50) + 5
            }

            const carDetails = []
            if (b.route.vehicle) {
                carDetails.push(`${b.route.vehicle.vehicleModel} (${b.route.vehicle.vehicleType})`)
                if (Array.isArray(b.route.vehicle.amenities) && b.route.vehicle.amenities.length) {
                    carDetails.push(...b.route.vehicle.amenities)
                }
            } else {
                carDetails.push('ไม่มีข้อมูลรถ')
            }

            const start = b.route.startLocation
            const end = b.route.endLocation

            const wp = b.route.waypoints || {}
            const baseList =
                (Array.isArray(wp.used) && wp.used.length ? wp.used : Array.isArray(wp.requested) ? wp.requested : []) || []
            const orderedList =
                Array.isArray(wp.optimizedOrder) && wp.optimizedOrder.length === baseList.length
                    ? wp.optimizedOrder.map((i) => baseList[i])
                    : baseList

            const stops = orderedList
                .map((p) => {
                    const name = p?.name || ''
                    const address = cleanAddr(p?.address || '')
                    const fallback =
                        p?.lat != null && p?.lng != null ? `(${Number(p.lat).toFixed(6)}, ${Number(p.lng).toFixed(6)})` : ''
                    const title = name || fallback
                    return address ? `${title} — ${address}` : title
                })
                .filter(Boolean)

            const stopsCoords = orderedList
                .map((p) =>
                    p && typeof p.lat === 'number' && typeof p.lng === 'number'
                        ? { lat: Number(p.lat), lng: Number(p.lng), name: p.name || '', address: p.address || '' }
                        : null
                )
                .filter(Boolean)

            // Logic: ถ้า Booking ยกเลิก/ปฏิเสธ ให้ยึดสถานะ Booking
            // แต่ถ้าเช่าอยู่ (Pending/Confirmed) แล้ว Route จบ ให้ถือว่า Completed
            let finalStatus = String(b.status || '').toLowerCase()
            if (!['cancelled', 'rejected'].includes(finalStatus) && b.route.status === 'COMPLETED') {
                finalStatus = 'completed'
            }

            return {
                id: b.id,
                routeId: b.route.id,
                status: finalStatus,
                origin: start?.name || `(${Number(start.lat).toFixed(2)}, ${Number(start.lng).toFixed(2)})`,
                destination: end?.name || `(${Number(end.lat).toFixed(2)}, ${Number(end.lng).toFixed(2)})`,
                originAddress: start?.address ? cleanAddr(start.address) : null,
                destinationAddress: end?.address ? cleanAddr(end.address) : null,
                originHasName: !!start?.name,
                destinationHasName: !!end?.name,
                pickupPoint: b.pickupLocation?.name || '-',
                date: dayjs(b.route.departureTime).format('D MMMM BBBB'),
                time: dayjs(b.route.departureTime).format('HH:mm น.'),
                price: (b.route.pricePerSeat || 0) * (b.numberOfSeats || 1),
                seats: b.numberOfSeats || 1,
                driver: { ...driverData, id: b.route.driver.id },
                coords: [
                    [start.lat, start.lng],
                    [end.lat, end.lng]
                ],
                polyline: b.route.routePolyline || null, // ใช้เมื่อมี
                stops,
                stopsCoords,
                carDetails,
                conditions: b.route.conditions,
                photos: b.route.vehicle?.photos || [],
                durationText:
                    (typeof b.route.duration === 'string' ? formatDuration(b.route.duration) : b.route.duration) ||
                    (typeof b.route.durationSeconds === 'number' ? `${Math.round(b.route.durationSeconds / 60)} นาที` : '-'),
                distanceText:
                    (typeof b.route.distance === 'string' ? formatDistance(b.route.distance) : b.route.distance) ||
                    (typeof b.route.distanceMeters === 'number' ? `${(b.route.distanceMeters / 1000).toFixed(1)} กม.` : '-'),
                hasReview: !!b.review
            }
        })

        allTrips.value = formatted

        // รอให้แผนที่พร้อมก่อน แล้วค่อย reverse geocode เพื่อได้ "ชื่อสถานที่" สวยๆ
        await waitMapReady()

        const jobs = allTrips.value.map(async (t, idx) => {
            const [o, d] = await Promise.all([reverseGeocode(t.coords[0][0], t.coords[0][1]), reverseGeocode(t.coords[1][0], t.coords[1][1])])
            const oParts = await extractNameParts(o)
            const dParts = await extractNameParts(d)

            if (!allTrips.value[idx].originHasName && oParts.name) {
                allTrips.value[idx].origin = oParts.name
            }
            if (!allTrips.value[idx].destinationHasName && dParts.name) {
                allTrips.value[idx].destination = dParts.name
            }
        })

        await Promise.allSettled(jobs)
    } catch (error) {
        console.error('Failed to fetch my trips:', error)
        allTrips.value = []
    } finally {
        isLoading.value = false
    }
}

function waitMapReady() {
    return new Promise((resolve) => {
        if (mapReady.value) return resolve(true)
        const t = setInterval(() => {
            if (mapReady.value) {
                clearInterval(t)
                resolve(true)
            }
        }, 50)
    })
}

function reverseGeocode(lat, lng) {
    return new Promise((resolve) => {
        if (!geocoder) return resolve(null)
        geocoder.geocode({ location: { lat, lng } }, (results, status) => {
            if (status !== 'OK' || !results?.length) return resolve(null)
            resolve(results[0])
        })
    })
}

async function extractNameParts(geocodeResult) {
    if (!geocodeResult) return { name: null, area: null }

    const comps = geocodeResult.address_components || []
    const byType = (t) => comps.find((c) => c.types.includes(t))?.long_name
    const byTypeShort = (t) => comps.find((c) => c.types.includes(t))?.short_name

    const types = geocodeResult.types || []
    const isPoi = types.includes('point_of_interest') || types.includes('establishment') || types.includes('premise')

    let name = null
    if (isPoi && geocodeResult.place_id) {
        const poiName = await getPlaceName(geocodeResult.place_id)
        if (poiName) name = poiName
    }
    if (!name) {
        const streetNumber = byType('street_number')
        const route = byType('route')
        name = streetNumber && route ? `${streetNumber} ${route}` : route || geocodeResult.formatted_address || null
    }

    const sublocality =
        byType('sublocality') || byType('neighborhood') || byType('locality') || byType('administrative_area_level_2')
    const province = byType('administrative_area_level_1') || byTypeShort('administrative_area_level_1')

    let area = null
    if (sublocality && province) area = `${sublocality}, ${province}`
    else if (province) area = province

    if (name) name = name.replace(/,?\s*(Thailand|ไทย)\s*$/i, '')
    return { name, area }
}

function getPlaceName(placeId) {
    return new Promise((resolve) => {
        if (!placesService || !placeId) return resolve(null)
        placesService.getDetails({ placeId, fields: ['name'] }, (place, status) => {
            if (status === google.maps.places.PlacesServiceStatus.OK && place?.name) resolve(place.name)
            else resolve(null)
        })
    })
}

const getTripCount = (status) => {
    if (status === 'all') return allTrips.value.length
    return allTrips.value.filter((trip) => trip.status === status).length
}

const toggleTripDetails = (tripId) => {
    const tripForMap = allTrips.value.find((trip) => trip.id === tripId)
    if (tripForMap) {
        updateMap(tripForMap)
    }

    if (selectedTripId.value === tripId) {
        selectedTripId.value = null
    } else {
        selectedTripId.value = tripId
    }
}

async function updateMap(trip) {
    if (!trip) return
    await waitMapReady()
    if (!gmap) return

    // cleanup ของเดิม
    if (activePolyline) {
        activePolyline.setMap(null)
        activePolyline = null
    }
    if (startMarker) {
        startMarker.setMap(null)
        startMarker = null
    }
    if (endMarker) {
        endMarker.setMap(null)
        endMarker = null
    }
    if (stopMarkers.length) {
        stopMarkers.forEach((m) => m.setMap(null))
        stopMarkers = []
    }

    const start = { lat: Number(trip.coords[0][0]), lng: Number(trip.coords[0][1]) }
    const end = { lat: Number(trip.coords[1][0]), lng: Number(trip.coords[1][1]) }

    // หมุด A/B
    startMarker = new google.maps.Marker({ position: start, map: gmap, label: 'A' })
    endMarker = new google.maps.Marker({ position: end, map: gmap, label: 'B' })

    if (Array.isArray(trip.stopsCoords) && trip.stopsCoords.length) {
        stopMarkers = trip.stopsCoords.map(
            (s, idx) =>
                new google.maps.Marker({
                    position: { lat: s.lat, lng: s.lng },
                    map: gmap,
                    icon: 'http://maps.google.com/mapfiles/ms/icons/green-dot.png',
                    title: s.name || s.address || `จุดแวะ ${idx + 1}`
                })
        )
    }

    // เส้นทางจาก polyline ถ้ามี
    if (trip.polyline && google.maps.geometry?.encoding) {
        const path = google.maps.geometry.encoding.decodePath(trip.polyline)
        activePolyline = new google.maps.Polyline({
            path,
            map: gmap,
            strokeColor: '#2563eb',
            strokeOpacity: 0.9,
            strokeWeight: 5
        })
        const bounds = new google.maps.LatLngBounds()
        path.forEach((p) => bounds.extend(p))

        if (trip.stopsCoords?.length) {
            trip.stopsCoords.forEach((s) => bounds.extend(new google.maps.LatLng(s.lat, s.lng)))
        }

        gmap.fitBounds(bounds)
    } else {
        // ไม่มี polyline → fit จากจุด A-B + จุดแวะ
        const bounds = new google.maps.LatLngBounds()
        bounds.extend(start)
        bounds.extend(end)
        if (trip.stopsCoords?.length) {
            trip.stopsCoords.forEach((s) => bounds.extend(new google.maps.LatLng(s.lat, s.lng)))
        }
        gmap.fitBounds(bounds)
    }
}

// --- Modal Logic ---
const isModalVisible = ref(false)
const tripToAction = ref(null)
const modalContent = ref({
    title: '',
    message: '',
    confirmText: '',
    action: null,
    variant: 'danger'
})

const openConfirmModal = (trip, action) => {
    tripToAction.value = trip
    if (action === 'cancel') {
        // ตอนนี้ไม่ใช้ทางยืนยันตรง ๆ แล้ว แต่คงโครงไว้เผื่ออนาคต
        modalContent.value = {
            title: 'ยืนยันการยกเลิกการจอง',
            message: `คุณต้องการยกเลิกการเดินทางไปที่ "${trip.destination}" ใช่หรือไม่?`,
            confirmText: 'ใช่, ยกเลิกการจอง',
            action: 'cancel',
            variant: 'danger'
        }
    } else if (action === 'delete') {
        modalContent.value = {
            title: 'ยืนยันการลบรายการ',
            message: `คุณต้องการลบรายการเดินทางไปที่ "${trip.destination}" ออกจากประวัติใช่หรือไม่?`,
            confirmText: 'ใช่, ลบรายการ',
            action: 'delete',
            variant: 'danger'
        }
    } else if (action === 'complete') {
        modalContent.value = {
            title: 'ยืนยันการสิ้นสุดการเดินทาง',
            message: `คุณต้องการยืนยันว่าการเดินทางไป "${trip.destination}" ได้เสร็จสิ้นแล้วใช่หรือไม่?`,
            confirmText: 'ใช่, สิ้นสุดการเดินทาง',
            action: 'complete',
            variant: 'primary'
        }
    }
    isModalVisible.value = true
}

const closeConfirmModal = () => {
    isModalVisible.value = false
    tripToAction.value = null
}

const handleConfirmAction = async () => {
    if (!tripToAction.value) return
    const action = modalContent.value.action
    const tripId = tripToAction.value.id
    try {
        if (action === 'cancel') {
            // ไม่ยิง PATCH ตรง ๆ — ต้องให้ผู้ใช้เลือกเหตุผลก่อน
            openCancelModal(tripToAction.value)
            closeConfirmModal()
            return
        } else if (action === 'delete') {
            await $api(`/bookings/${tripId}`, { method: 'DELETE' })
            toast.success('ลบรายการสำเร็จ', 'รายการได้ถูกลบออกจากประวัติแล้ว')
        } else if (action === 'complete') {
            await $api(`/routes/${trip.routeId}/complete`, { method: 'PATCH' }) // ต้องใช้ routeId ไม่ใช่ bookingId
            toast.success('สำเร็จ', 'บันทึกการสิ้นสุดการเดินทางเรียบร้อยแล้ว')
        }
        closeConfirmModal()
        await fetchMyTrips()
    } catch (error) {
        console.error(`Failed to ${action} booking:`, error)
        toast.error('เกิดข้อผิดพลาด', error.data?.message || 'ไม่สามารถดำเนินการได้')
        closeConfirmModal()
    }
}

function openCancelModal(trip) {
    tripToCancel.value = trip
    selectedCancelReason.value = ''
    cancelReasonError.value = ''
    isCancelModalVisible.value = true
}

function closeCancelModal() {
    isCancelModalVisible.value = false
    tripToCancel.value = null
}

async function submitCancel() {
    if (!selectedCancelReason.value) {
        cancelReasonError.value = 'กรุณาเลือกเหตุผล'
        return
    }
    if (!tripToCancel.value) return

    isSubmittingCancel.value = true
    try {
        await $api(`/bookings/${tripToCancel.value.id}/cancel`, {
            method: 'PATCH',
            body: { reason: selectedCancelReason.value } // ✅ ตรงกับ schema ฝั่ง backend
        })
        toast.success('ยกเลิกการจองสำเร็จ', 'ระบบบันทึกเหตุผลแล้ว')
        closeCancelModal()
        await fetchMyTrips()
    } catch (err) {
        console.error('Cancel booking failed:', err)
        toast.error('เกิดข้อผิดพลาด', err?.data?.message || 'ไม่สามารถยกเลิกได้')
    } finally {
        isSubmittingCancel.value = false
    }
}

function formatDistance(input) {
    if (typeof input !== 'string') return input
    const parts = input.split('+')
    if (parts.length <= 1) return input

    let meters = 0
    for (const seg of parts) {
        const n = parseFloat(seg.replace(/[^\d.]/g, ''))
        if (Number.isNaN(n)) continue
        if (/กม/.test(seg)) meters += n * 1000
        else if (/เมตร|ม\./.test(seg)) meters += n
        else meters += n // สมมติเป็นเมตรถ้าไม่พบหน่วย
    }

    if (meters >= 1000) {
        const km = Math.round((meters / 1000) * 10) / 10 // ปัดทศนิยม 1 ตำแหน่ง
        return `${(km % 1 === 0 ? km.toFixed(0) : km)} กม.`
    }
    return `${Math.round(meters)} ม.`
}

function formatDuration(input) {
    if (typeof input !== 'string') return input
    const parts = input.split('+')
    if (parts.length <= 1) return input

    let minutes = 0
    for (const seg of parts) {
        const n = parseFloat(seg.replace(/[^\d.]/g, ''))
        if (Number.isNaN(n)) continue
        if (/ชม/.test(seg)) minutes += n * 60
        else minutes += n // นาที
    }

    const h = Math.floor(minutes / 60)
    const m = Math.round(minutes % 60)
    return h ? (m ? `${h} ชม. ${m} นาที` : `${h} ชม.`) : `${m} นาที`
}

// --- Lifecycle and Watchers ---
useHead({
    title: 'การเดินทางของฉัน - ไปนำแหน่',
    link: [{ rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=Kanit:wght@300;400;500;600;700&display=swap' }],
    script:
        process.client && !window.google?.maps
            ? [
                {
                    key: 'gmaps',
                    src: `https://maps.googleapis.com/maps/api/js?key=${useRuntimeConfig().public.googleMapsApiKey}&libraries=places,geometry&callback=__gmapsReady__`,
                    async: true,
                    defer: true
                }
            ]
            : []
})

onMounted(() => {
    // ถ้า script โหลดแล้ว
    if (window.google?.maps) {
        initializeMap()
        fetchMyTrips().then(() => {
            // ถ้ามีข้อมูลแล้วและยังไม่ได้เลือก ให้โชว์แผนที่ของรายการแรกในแท็บปัจจุบัน
            if (filteredTrips.value.length) updateMap(filteredTrips.value[0])
        })
        return
    }

    // ยังไม่โหลดเสร็จ: ตั้ง callback
    window[GMAPS_CB] = () => {
        try {
            delete window[GMAPS_CB]
        } catch { }
        initializeMap()
        fetchMyTrips().then(() => {
            if (filteredTrips.value.length) updateMap(filteredTrips.value[0])
        })
    }
})

function initializeMap() {
    if (!mapContainer.value || gmap) return
    gmap = new google.maps.Map(mapContainer.value, {
        center: { lat: 13.7563, lng: 100.5018 },
        zoom: 6,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: true
    })
    geocoder = new google.maps.Geocoder()
    placesService = new google.maps.places.PlacesService(gmap)
    mapReady.value = true
}

// --- Review / Report Modal State ---
const showReviewModal = ref(false)
const reviewTrip = ref(null)
const reviewRating = ref(5)
const reviewText = ref('')
const reviewImages = ref([])

function openReviewModal(trip) {
    reviewTrip.value = trip
    reviewRating.value = 5
    reviewText.value = ''
    reviewImages.value.forEach(it => it.url && URL.revokeObjectURL(it.url))
    reviewImages.value = []
    showReviewModal.value = true
}

function closeReviewModal() {
    showReviewModal.value = false
    setTimeout(() => { reviewTrip.value = null }, 200)
}

function handleReviewFiles(e) {
    const files = Array.from(e.target.files || [])
    const remaining = 2 - reviewImages.value.length
    files.slice(0, remaining).forEach(f => {
        reviewImages.value.push({ file: f, url: URL.createObjectURL(f) })
    })
    e.target.value = ''
}

function removeReviewImage(idx) {
    const it = reviewImages.value[idx]
    if (it?.url) URL.revokeObjectURL(it.url)
    reviewImages.value.splice(idx, 1)
}

async function submitReview() {
    if (!reviewTrip.value) return

    try {
        const payload = {
            bookingId: reviewTrip.value.id,
            rating: reviewRating.value,
            comment: reviewText.value || '',
            images: reviewImages.value.length
                ? reviewImages.value.map(img => img.url)
                : null
        }

        // send review to backend
        await $api('/reviews', {
            method: 'POST',
            body: payload
        })

        toast.success('ขอบคุณสำหรับรีวิว!', 'รีวิวของคุณถูกส่งแล้ว')

        const tripInList = allTrips.value.find(
            trip => trip.id === reviewTrip.value.id
        )

        if (tripInList) {
            tripInList.hasReview = true
        }

        // reset state ของ modal
        reviewRating.value = 5
        reviewText.value = ''
        reviewImages.value.forEach(it => it.url && URL.revokeObjectURL(it.url))
        reviewImages.value = []

        closeReviewModal()
        // await fetchMyTrips()

    } catch (err) {
        console.error('Error creating review:', err)
        toast.error(
            'ไม่สามารถส่งรีวิวได้',
            err?.data?.message || 'โปรดลองอีกครั้ง'
        )
    }
}

async function checkCanReview(bookingId) {
    const res = await $api(`/reviews/booking/${bookingId}`)
    canReview.value = !res.hasReview
}

// --- Report Modal State ---
const showReportModal = ref(false)
const reportTrip = ref(null)
const reportText = ref('')
const reportImages = ref([])

function openReportModal(trip) {
    reportTrip.value = trip
    reportText.value = ''
    reportImages.value.forEach(it => it.url && URL.revokeObjectURL(it.url))
    reportImages.value = []
    showReportModal.value = true
}

function closeReportModal() {
    showReportModal.value = false
    setTimeout(() => { reportTrip.value = null }, 200)
}

function handleReportFiles(e) {
    const files = Array.from(e.target.files || [])
    const remaining = 2 - reportImages.value.length
    files.slice(0, remaining).forEach(f => {
        reportImages.value.push({ file: f, url: URL.createObjectURL(f) })
    })
    e.target.value = ''
}

function removeReportImage(idx) {
    const it = reportImages.value[idx]
    if (it?.url) URL.revokeObjectURL(it.url)
    reportImages.value.splice(idx, 1)
}

async function submitReport() {
    if (!reportTrip.value) return
    try {
        const fd = new FormData()
        fd.append('routeId', reportTrip.value.routeId)
        fd.append('text', reportText.value || '')
        reportImages.value.forEach((it) => fd.append('images', it.file))

        await $api('/reports', { method: 'POST', body: fd })
        toast.success('ขอบคุณที่แจ้งรายงาน', 'ทีมงานจะตรวจสอบในเร็วๆ นี้')
        closeReportModal()
    } catch (err) {
        console.error('Failed to submit report', err)
        toast.error('ไม่สามารถส่งรายงานได้', err?.data?.message || 'โปรดลองอีกครั้ง')
    }
}
</script>

<style scoped>
.trip-card {
    transition: all 0.3s ease;
    cursor: pointer;
}

.trip-card:hover {
    /* transform: translateY(-2px); */
    box-shadow: 0 10px 25px rgba(59, 130, 246, 0.1);
}

.tab-button {
    transition: all 0.3s ease;
}

.tab-button.active {
    background-color: #3b82f6;
    color: white;
    box-shadow: 0 4px 14px rgba(59, 130, 246, 0.3);
}

.tab-button:not(.active) {
    background-color: white;
    color: #6b7280;
    border: 1px solid #d1d5db;
}

.tab-button:not(.active):hover {
    background-color: #f9fafb;
    color: #374151;
}

#map {
    height: 100%;
    min-height: 600px;
    border-radius: 0 0 0.5rem 0.5rem;
}

.status-badge {
    display: inline-flex;
    align-items: center;
    padding: 0.25rem 0.75rem;
    border-radius: 9999px;
    font-size: 0.875rem;
    font-weight: 500;
}

.status-pending {
    background-color: #fef3c7;
    color: #d97706;
}

.status-confirmed {
    background-color: #d1fae5;
    color: #065f46;
}

.status-rejected {
    background-color: #fee2e2;
    color: #dc2626;
}

.status-cancelled {
    background-color: #f3f4f6;
    color: #6b7280;
}

@keyframes slide-in-from-top {
    from {
        opacity: 0;
        transform: translateY(-10px);
    }

    to {
        opacity: 1;
        transform: translateY(0);
    }
}

.animate-in {
    animation-fill-mode: both;
}

.slide-in-from-top {
    animation-name: slide-in-from-top;
}

.duration-300 {
    animation-duration: 300ms;
}
</style>