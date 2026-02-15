<template>
    <div class="">
        <AdminHeader />
        <AdminSidebar />

        <!-- Main Content -->
        <main id="main-content" class="main-content mt-16 ml-0 lg:ml-[280px] p-6">
            <div class="mx-auto max-w-2xl">
                <!-- Back Button + Title -->
                <div class="flex items-center gap-4 mb-6">
                    <button @click="goBack"
                        class="flex items-center gap-2 px-3 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50">
                        <i class="fa-solid fa-arrow-left"></i>
                        <span>ยกเลิก</span>
                    </button>
                    <h1 class="text-2xl font-semibold text-gray-800">แก้ไขสถานะรายงาน #{{ reportId }}</h1>
                </div>

                <!-- Loading / Error -->
                <div v-if="isLoading" class="text-center py-10 text-gray-500">
                    <i class="fas fa-spinner fa-spin text-2xl mb-3"></i>
                    <p>กำลังโหลด...</p>
                </div>

                <div v-else-if="loadError" class="bg-red-50 border border-red-200 rounded-lg p-6 mb-6">
                    <p class="text-red-700">{{ loadError }}</p>
                </div>

                <!-- Edit Form -->
                <div v-else-if="report" class="bg-white border border-gray-300 rounded-lg shadow-sm p-6">
                    <!-- Current Status Badge -->
                    <div class="mb-6 pb-6 border-b border-gray-200">
                        <p class="text-sm text-gray-600 mb-3">สถานะปัจจุบัน</p>
                        <div class="flex items-center gap-2">
                            <span class="inline-flex items-center px-3 py-1 text-sm font-medium rounded-full gap-1"
                                :class="statusBadgeClass(report.status)">
                                <i :class="statusIconClass(report.status)"></i>
                                {{ statusLabelTh(report.status) }}
                            </span>
                        </div>
                    </div>

                    <!-- Report Title and Description (Read-only) -->
                    <div class="mb-6 pb-6 border-b border-gray-200">
                        <h3 class="text-lg font-medium text-gray-900 mb-2">{{ report.title }}</h3>
                        <p class="text-gray-700 text-sm whitespace-pre-wrap">{{ report.description }}</p>
                    </div>

                    <!-- Form: Status Selection -->
                    <div class="mb-6">
                        <label class="block mb-2 text-sm font-medium text-gray-700">สถานะใหม่ <span class="text-red-500">*</span></label>
                        <select v-model="formData.status"
                            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                            <option value="PENDING">รอพิจารณา</option>
                            <option value="APPROVED">อนุมัติ</option>
                            <option value="REJECTED">ปฏิเสธ</option>
                            <option value="RESOLVED">แก้ไขแล้ว</option>
                        </select>
                    </div>

                    <!-- Form: Admin Notes -->
                    <div class="mb-8">
                        <label class="block mb-2 text-sm font-medium text-gray-700">หมายเหตุจากแอดมิน</label>
                        <textarea v-model="formData.adminNotes" rows="6"
                            placeholder="เพิ่มหมายเหตุการตัดสินใจของแอดมิน (ไม่จำเป็น)"
                            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"></textarea>
                        <p class="text-xs text-gray-500 mt-1">ตัวอักษร {{ formData.adminNotes.length }} / 2000</p>
                    </div>

                    <!-- Buttons -->
                    <div class="flex gap-3">
                        <button @click="goBack"
                            class="flex-1 px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                            ยกเลิก
                        </button>
                        <button @click="submitUpdate" :disabled="isSubmitting"
                            class="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2">
                            <i class="fas fa-save" v-if="!isSubmitting"></i>
                            <i class="fas fa-spinner fa-spin" v-else></i>
                            <span>{{ isSubmitting ? 'กำลังบันทึก...' : 'บันทึก' }}</span>
                        </button>
                    </div>
                </div>
            </div>
        </main>

        <!-- Mobile Overlay -->
        <div id="overlay" class="fixed inset-0 z-40 hidden bg-black bg-opacity-50 lg:hidden"
            @click="closeMobileSidebar"></div>
    </div>
</template>

<script setup>
import { ref, reactive, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AdminHeader from '~/components/admin/AdminHeader.vue'
import AdminSidebar from '~/components/admin/AdminSidebar.vue'
import { useToast } from '~/composables/useToast'
import { useReport } from '~/composables/useReport'

definePageMeta({ middleware: ['admin-auth'] })

const route = useRoute()
const router = useRouter()
const { toast } = useToast()
const { getReportById, updateReportStatus } = useReport()

const reportId = route.params.id
const report = ref(null)
const isLoading = ref(false)
const loadError = ref('')
const isSubmitting = ref(false)

const formData = reactive({
    status: 'PENDING',
    adminNotes: ''
})

// --- Fetch Report ---
async function fetchReport() {
    isLoading.value = true
    loadError.value = ''
    try {
        report.value = await getReportById(reportId)
        if (!report.value) {
            loadError.value = 'ไม่พบรายงาน'
        } else {
            // Initialize form with current data
            formData.status = report.value.status
            formData.adminNotes = report.value.adminNotes || ''
        }
    } catch (err) {
        console.error(err)
        loadError.value = err?.message || 'ไม่สามารถโหลดข้อมูลได้'
        toast.error('เกิดข้อผิดพลาด', loadError.value)
    } finally {
        isLoading.value = false
    }
}

// --- Submit Update ---
async function submitUpdate() {
    if (!formData.status) {
        toast.error('ข้อผิดพลาด', 'กรุณาเลือกสถานะ')
        return
    }

    isSubmitting.value = true
    try {
        await updateReportStatus(reportId, formData.status, formData.adminNotes)
        toast.success('บันทึกสำเร็จ', 'อัปเดตสถานะรายงานเรียบร้อย')
        router.push(`/admin/reports/${reportId}`)
    } catch (err) {
        console.error(err)
        const msg = err?.message || 'ไม่สามารถอัปเดตได้'
        toast.error('อัปเดตไม่สำเร็จ', msg)
    } finally {
        isSubmitting.value = false
    }
}

// --- Helper Functions ---
function statusBadgeClass(status) {
    const badges = {
        'PENDING': 'bg-yellow-100 text-yellow-700',
        'APPROVED': 'bg-green-100 text-green-700',
        'REJECTED': 'bg-red-100 text-red-700',
        'RESOLVED': 'bg-blue-100 text-blue-700'
    }
    return badges[status] || 'bg-gray-100 text-gray-700'
}

function statusIconClass(status) {
    const icons = {
        'PENDING': 'fa-solid fa-hourglass-end',
        'APPROVED': 'fa-solid fa-circle-check',
        'REJECTED': 'fa-solid fa-circle-xmark',
        'RESOLVED': 'fa-solid fa-check-double'
    }
    return icons[status] || 'fa-solid fa-circle'
}

function statusLabelTh(status) {
    const labels = {
        'PENDING': 'รอพิจารณา',
        'APPROVED': 'อนุมัติ',
        'REJECTED': 'ปฏิเสธ',
        'RESOLVED': 'แก้ไขแล้ว'
    }
    return labels[status] || status
}

// --- Navigation ---
function goBack() {
    router.back()
}

// --- Lifecycle ---
function defineGlobalScripts() {
    window.toggleSidebar = function () {
        const sidebar = document.getElementById('sidebar')
        const mainContent = document.getElementById('main-content')
        const toggleIcon = document.getElementById('toggle-icon')
        if (!sidebar || !mainContent || !toggleIcon) return
        sidebar.classList.toggle('collapsed')
        if (sidebar.classList.contains('collapsed')) {
            mainContent.style.marginLeft = '80px'
            toggleIcon.classList.replace('fa-chevron-left', 'fa-chevron-right')
        } else {
            mainContent.style.marginLeft = '280px'
            toggleIcon.classList.replace('fa-chevron-right', 'fa-chevron-left')
        }
    }

    window.toggleMobileSidebar = function () {
        const sidebar = document.getElementById('sidebar')
        const overlay = document.getElementById('overlay')
        if (!sidebar || !overlay) return
        sidebar.classList.toggle('mobile-open')
        overlay.classList.toggle('hidden')
    }

    window.toggleSubmenu = function (menuId) {
        const menu = document.getElementById(menuId)
        const icon = document.getElementById(menuId + '-icon')
        if (!menu || !icon) return
        menu.classList.toggle('hidden')
        if (menu.classList.contains('hidden')) {
            icon.classList.replace('fa-chevron-up', 'fa-chevron-down')
        } else {
            icon.classList.replace('fa-chevron-down', 'fa-chevron-up')
        }
    }

    window.__adminResizeHandler__ = function () {
        const sidebar = document.getElementById('sidebar')
        const mainContent = document.getElementById('main-content')
        const overlay = document.getElementById('overlay')
        if (!sidebar || !mainContent || !overlay) return
        if (window.innerWidth >= 1024) {
            sidebar.classList.remove('mobile-open')
            overlay.classList.add('hidden')
            if (sidebar.classList.contains('collapsed')) {
                mainContent.style.marginLeft = '80px'
            } else {
                mainContent.style.marginLeft = '280px'
            }
        } else {
            mainContent.style.marginLeft = '0'
        }
    }

    window.addEventListener('resize', window.__adminResizeHandler__)
}

function cleanupGlobalScripts() {
    window.removeEventListener('resize', window.__adminResizeHandler__ || (() => { }))
    delete window.toggleSidebar
    delete window.toggleMobileSidebar
    delete window.closeMobileSidebar
    delete window.toggleSubmenu
    delete window.__adminResizeHandler__
}

function closeMobileSidebar() {
    const sidebar = document.getElementById('sidebar')
    const overlay = document.getElementById('overlay')
    if (!sidebar || !overlay) return
    sidebar.classList.remove('mobile-open')
    overlay.classList.add('hidden')
}

useHead({
    title: `Edit Report #${reportId} - TailAdmin Dashboard`,
    link: [{ rel: 'stylesheet', href: 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css' }]
})

onMounted(() => {
    defineGlobalScripts()
    if (typeof window.__adminResizeHandler__ === 'function') window.__adminResizeHandler__()
    fetchReport()
})

onUnmounted(() => {
    cleanupGlobalScripts()
})
</script>

<style scoped>
.sidebar {
    transition: width 0.3s ease;
}

.sidebar.collapsed {
    width: 80px;
}

.sidebar:not(.collapsed) {
    width: 280px;
}

.main-content {
    transition: margin-left 0.3s ease;
}

@media (max-width: 768px) {
    .sidebar {
        position: fixed;
        z-index: 1000;
        transform: translateX(-100%);
    }

    .sidebar.mobile-open {
        transform: translateX(0);
    }

    .main-content {
        margin-left: 0 !important;
    }
}
</style>
