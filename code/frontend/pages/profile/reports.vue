<template>
    <div>
        <div class="flex items-center justify-center py-8">
            <div class="flex w-full max-w-6xl mx-4 overflow-hidden bg-white border border-gray-300 rounded-lg shadow-lg">
                <ProfileSidebar />

                <main class="flex-1 p-8 overflow-y-auto">
                    <!-- Header -->
                    <div class="mb-8">
                        <div class="flex items-center gap-3 mb-2">
                            <div class="p-2 bg-red-100 rounded-xl">
                                <svg class="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                            </div>
                            <h1 class="text-2xl font-bold text-gray-900">รายงานและติดตามปัญหา</h1>
                        </div>
                        <p class="text-gray-500 text-sm ml-1">รายงานปัญหาเกี่ยวกับระบบและติดตามสถานะรายงานของคุณ</p>
                    </div>

                    <!-- Tab Switcher -->
                    <div class="flex bg-gray-100 rounded-xl p-1 mb-8 w-fit gap-1">
                        <button @click="activeTab = 'create'" class="px-6 py-2 text-sm font-bold rounded-lg transition-all"
                            :class="activeTab === 'create' ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'">
                            รายงานปัญหา
                        </button>
                        <button @click="activeTab = 'history'" class="px-6 py-2 text-sm font-bold rounded-lg transition-all"
                            :class="activeTab === 'history' ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'">
                            ประวัติรายงาน
                            <span v-if="myReports.length" class="ml-1.5 inline-flex items-center justify-center w-5 h-5 text-[10px] font-bold rounded-full"
                                :class="activeTab === 'history' ? 'bg-gray-900 text-white' : 'bg-gray-400 text-white'">{{ myReports.length }}</span>
                        </button>
                    </div>

                    <!-- Create Report Tab -->
                    <div v-if="activeTab === 'create'" class="max-w-xl">
                        <div class="bg-white border border-gray-200 rounded-2xl shadow-sm p-6 space-y-5">
                            <h2 class="text-base font-bold text-gray-800">สร้างรายงานใหม่</h2>

                            <!-- Type -->
                            <div>
                                <label class="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">ประเภทรายงาน</label>
                                <select v-model="form.type" class="w-full p-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-red-400 outline-none bg-white">
                                    <option value="PASSENGER">รายงานในฐานะผู้โดยสาร</option>
                                    <option value="DRIVER">รายงานในฐานะผู้ขับขี่</option>
                                </select>
                            </div>

                            <!-- Category -->
                            <div>
                                <label class="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">หมวดหมู่ปัญหา</label>
                                <select v-model="form.category" class="w-full p-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-red-400 outline-none bg-white">
                                    <option value="VEHICLE_ISSUE">ปัญหายานพาหนะ/ข้อมูลรถไม่ตรง</option>
                                    <option value="SAFETY_ISSUE">ปัญหาความปลอดภัย</option>
                                    <option value="ROAD_ISSUE">ปัญหาถนน / เส้นทาง</option>
                                    <option value="PAYMENT_ISSUE">ปัญหาการชำระเงิน</option>
                                    <option value="PASSENGER_ISSUE">พฤติกรรมไม่เหมาะสม</option>
                                    <option value="LATE_ISSUE">ความล่าช้า</option>
                                    <option value="WRONG_INFO">ข้อมูลไม่ตรงตามที่ระบุ</option>
                                    <option value="APP_ISSUE">ปัญหาการใช้งานแอปพลิเคชัน</option>
                                    <option value="NO_SHOW">ไม่มาพบตามจุดนัดหมาย</option>
                                    <option value="OTHER">อื่นๆ</option>
                                </select>
                            </div>

                            <!-- Description -->
                            <div>
                                <label class="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">รายละเอียด</label>
                                <textarea v-model="form.description" rows="5" placeholder="อธิบายปัญหาที่พบอย่างละเอียด..." 
                                    class="w-full p-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-red-400 outline-none resize-none"></textarea>
                                <p class="text-[11px] text-gray-400 mt-1 text-right">{{ form.description.length }}/2000</p>
                            </div>

                            <!-- File Attachments -->
                            <div>
                                <label class="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">แนบไฟล์ (สูงสุด 3 ไฟล์ — รูป / วิดีโอ / เสียง)</label>
                                <div class="flex flex-wrap gap-2">
                                    <div v-for="(f, i) in reportFiles" :key="i" class="relative w-20 h-20 rounded-xl overflow-hidden border border-gray-200 bg-gray-50">
                                        <img v-if="f.type.startsWith('image/')" :src="f.preview" class="w-full h-full object-cover" />
                                        <div v-else class="w-full h-full flex flex-col items-center justify-center gap-1">
                                            <svg v-if="f.type.startsWith('video/')" class="w-7 h-7 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M3 8a2 2 0 012-2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z"/>
                                            </svg>
                                            <svg v-else class="w-7 h-7 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"/>
                                            </svg>
                                            <span class="text-[9px] text-gray-500">{{ f.type.startsWith('video/') ? 'วิดีโอ' : 'เสียง' }}</span>
                                        </div>
                                        <button @click="removeFile(i)" class="absolute top-1 right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center shadow">
                                            <svg class="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M6 18L18 6M6 6l12 12"/></svg>
                                        </button>
                                    </div>
                                    <label v-if="reportFiles.length < 3" class="w-20 h-20 flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-300 cursor-pointer hover:border-red-400 hover:bg-red-50 transition">
                                        <svg class="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
                                        <span class="text-[10px] text-gray-400 mt-1">เพิ่มไฟล์</span>
                                        <input type="file" accept="image/*,video/*,audio/*" class="hidden" @change="onFileChange" />
                                    </label>
                                </div>
                            </div>

                            <button @click="submitReport" :disabled="isSubmitting"
                                class="w-full py-3.5 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 disabled:opacity-50 transition flex items-center justify-center gap-2">
                                <svg v-if="isSubmitting" class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                                {{ isSubmitting ? 'กำลังส่ง...' : 'ส่งรายงาน' }}
                            </button>
                        </div>
                    </div>

                    <!-- History Tab -->
                    <div v-if="activeTab === 'history'">
                        <div v-if="isLoadingHistory" class="space-y-4">
                            <div v-for="i in 3" :key="i" class="h-28 bg-gray-100 rounded-2xl animate-pulse"></div>
                        </div>

                        <div v-else-if="myReports.length === 0" class="text-center py-16">
                            <div class="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <svg class="w-10 h-10 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                                </svg>
                            </div>
                            <p class="text-gray-500 font-medium">ยังไม่มีรายงานใดๆ</p>
                            <p class="text-sm text-gray-400 mt-1">รายงานปัญหาจะแสดงที่นี่หลังจากที่คุณส่งรายงาน</p>
                            <button @click="activeTab = 'create'" class="mt-4 px-5 py-2 bg-red-600 text-white text-sm font-bold rounded-xl hover:bg-red-700 transition">สร้างรายงานแรก</button>
                        </div>

                        <div v-else class="space-y-4">
                            <div v-for="report in myReports" :key="report.id"
                                class="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition cursor-pointer"
                                @click="selectedReport = selectedReport?.id === report.id ? null : report">
                                <div class="flex items-start justify-between gap-4">
                                    <div class="flex-1 min-w-0">
                                        <div class="flex items-center gap-2 flex-wrap mb-1">
                                            <span class="text-sm font-bold text-gray-900">{{ categoryLabel(report.category) }}</span>
                                            <span class="text-xs px-2 py-0.5 rounded-full font-semibold" :class="statusClass(report.status)">{{ statusLabel(report.status) }}</span>
                                        </div>
                                        <p class="text-sm text-gray-600 truncate">{{ report.description }}</p>
                                        <p class="text-xs text-gray-400 mt-1">{{ formatDate(report.createdAt) }}</p>
                                    </div>
                                    <div class="flex-shrink-0">
                                        <div class="w-10 h-10 rounded-xl flex items-center justify-center" :class="typeClass(report.type)">
                                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
                                            </svg>
                                        </div>
                                    </div>
                                </div>

                                <!-- Expanded Detail -->
                                <div v-if="selectedReport?.id === report.id" class="mt-4 pt-4 border-t border-gray-100 space-y-3">
                                    <div>
                                        <p class="text-xs text-gray-400 font-semibold uppercase tracking-wider mb-1">รายละเอียดเต็ม</p>
                                        <p class="text-sm text-gray-700 whitespace-pre-line">{{ report.description }}</p>
                                    </div>
                                    <div v-if="report.adminNotes" class="p-3 bg-blue-50 rounded-xl border border-blue-100">
                                        <p class="text-xs text-blue-600 font-bold uppercase tracking-wider mb-1">หมายเหตุจากทีมงาน</p>
                                        <p class="text-sm text-blue-800">{{ report.adminNotes }}</p>
                                    </div>
                                    <div v-if="report.images?.length" class="flex flex-wrap gap-2">
                                        <a v-for="(img, i) in report.images" :key="i" :href="img" target="_blank" rel="noopener">
                                            <img :src="img" class="w-20 h-20 rounded-xl object-cover border border-gray-200 hover:opacity-80 transition" />
                                        </a>
                                    </div>
                                    <div class="flex items-center gap-2 text-xs text-gray-400">
                                        <span>อัปเดตล่าสุด: {{ formatDate(report.updatedAt) }}</span>
                                        <span v-if="report.resolvedAt">· แก้ไขแล้วเมื่อ: {{ formatDate(report.resolvedAt) }}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useAuth } from '~/composables/useAuth'
import { useToast } from '~/composables/useToast'
import ProfileSidebar from '~/components/ProfileSidebar.vue'
import dayjs from 'dayjs'
import 'dayjs/locale/th'
import { useSocket } from '~/composables/useSocket'

dayjs.locale('th')

definePageMeta({ middleware: 'auth' })

const { $api } = useNuxtApp()
const { toast } = useToast()

// --- Tabs ---
const activeTab = ref('create')

// --- Create report form ---
const form = reactive({
    type: 'PASSENGER',
    category: 'OTHER',
    description: '',
})
const reportFiles = ref([])
const isSubmitting = ref(false)

function validateFile(file) {
    const maxSize = 100 * 1024 * 1024; // 100MB
    const allowedTypes = ['image/', 'video/', 'audio/'];
    
    if (file.size > maxSize) {
        toast.error('ไฟล์มีขนาดใหญ่เกินไป', 'ขนาดไฟล์สูงสุดคือ 100MB');
        return false;
    }
    
    const isAllowed = allowedTypes.some(type => file.type.startsWith(type));
    if (!isAllowed) {
        toast.error('ประเภทไฟล์ไม่ถูกต้อง', 'กรุณาแนบเฉพาะรูปภาพ วิดีโอ หรือเสียง');
        return false;
    }
    
    return true;
}

function onFileChange(e) {
    const file = e.target.files?.[0]
    if (!file) return

    if (reportFiles.value.length >= 3) {
        toast.error('จำกัดจำนวนไฟล์', 'สามารถแนบไฟล์ได้สูงสุด 3 ไฟล์')
        e.target.value = ''
        return
    }

    if (!validateFile(file)) {
        e.target.value = ''
        return
    }

    const preview = file.type.startsWith('image/') ? URL.createObjectURL(file) : null
    reportFiles.value.push({ file, type: file.type, preview })
    e.target.value = ''
}

function removeFile(idx) {
    const f = reportFiles.value[idx]
    if (f?.preview) URL.revokeObjectURL(f.preview)
    reportFiles.value.splice(idx, 1)
}

async function submitReport() {
    if (!form.description.trim() || form.description.length < 5) {
        toast.error('กรุณากรอกรายละเอียด', 'รายละเอียดต้องมีอย่างน้อย 5 ตัวอักษร')
        return
    }
    isSubmitting.value = true
    try {
        const fd = new FormData()
        fd.append('type', form.type)
        fd.append('category', form.category)
        fd.append('description', form.description)
        reportFiles.value.forEach(f => fd.append('images', f.file))

        await $api('/reports', { method: 'POST', body: fd })
        toast.success('ส่งรายงานแล้ว', 'ทีมงานจะตรวจสอบข้อมูลของคุณโดยเร็ว')

        // Reset
        form.description = ''
        form.type = 'PASSENGER'
        form.category = 'OTHER'
        reportFiles.value.forEach(f => { if (f.preview) URL.revokeObjectURL(f.preview) })
        reportFiles.value = []

        // Refresh history and switch tab
        await fetchMyReports()
        activeTab.value = 'history'
    } catch (err) {
        toast.error('เกิดข้อผิดพลาด', err.data?.message || 'ไม่สามารถส่งรายงานได้')
    } finally {
        isSubmitting.value = false
    }
}

// --- History ---
const myReports = ref([])
const isLoadingHistory = ref(false)
const selectedReport = ref(null)

async function fetchMyReports() {
    isLoadingHistory.value = true
    try {
        const res = await $api('/reports/me')
        myReports.value = res || []
    } catch (err) {
        console.error('fetch reports error', err)
    } finally {
        isLoadingHistory.value = false
    }
}

// --- Helpers ---
function formatDate(d) {
    if (!d) return ''
    return dayjs(d).format('D MMM YYYY HH:mm')
}

function categoryLabel(cat) {
    const map = {
        VEHICLE_ISSUE: 'ปัญหายานพาหนะ',
        SAFETY_ISSUE: 'ปัญหาความปลอดภัย',
        ROAD_ISSUE: 'ปัญหาถนน / เส้นทาง',
        PAYMENT_ISSUE: 'ปัญหาการชำระเงิน',
        PASSENGER_ISSUE: 'พฤติกรรมไม่เหมาะสม',
        LATE_ISSUE: 'ความล่าช้า',
        WRONG_INFO: 'ข้อมูลไม่ตรงตามที่ระบุ',
        APP_ISSUE: 'ปัญหาการใช้งานแอปพลิเคชัน',
        NO_SHOW: 'ไม่มาพบตามจุดนัดหมาย',
        OTHER: 'อื่นๆ',
    }
    return map[cat] || cat
}

function statusLabel(s) {
    const map = { PENDING: 'รอพิจารณา', APPROVED: 'รับเรื่อง', REJECTED: 'ปฏิเสธ', RESOLVED: 'แก้ไขแล้ว' }
    return map[s] || s
}

function statusClass(s) {
    const map = {
        PENDING: 'bg-yellow-100 text-yellow-700',
        APPROVED: 'bg-blue-100 text-blue-700',
        REJECTED: 'bg-red-100 text-red-700',
        RESOLVED: 'bg-green-100 text-green-700',
    }
    return map[s] || 'bg-gray-100 text-gray-600'
}

function typeClass(type) {
    return type === 'DRIVER' ? 'bg-blue-100 text-blue-600' : 'bg-orange-100 text-orange-600'
}

onMounted(() => {
    fetchMyReports()
})
</script>
