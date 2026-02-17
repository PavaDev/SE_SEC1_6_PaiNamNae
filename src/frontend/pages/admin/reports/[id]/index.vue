<template>
    <div class="">
        <AdminHeader />
        <AdminSidebar />

        <!-- Main Content -->
        <main id="main-content" class="main-content mt-16 ml-0 lg:ml-[280px] p-6">
            <div class="mx-auto max-w-4xl">
                <!-- Back Button + Title -->
                <div class="flex items-center justify-between gap-4 mb-6">
                    <div class="flex items-center gap-4">
                        <button @click="goBack"
                            class="flex items-center gap-2 px-3 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50">
                            <i class="fa-solid fa-arrow-left"></i>
                            <span>กลับ</span>
                        </button>
                        <h1 class="text-2xl font-semibold text-gray-800">รายละเอียดรายงาน #{{ reportId }}</h1>
                    </div>
                    
                    <!--  Quick Status Change Buttons (4 สถานะ) -->
                    <div v-if="report" class="flex flex-wrap gap-2">
                        <button @click="quickUpdateStatus('PENDING')" 
                            :disabled="report.status === 'PENDING'"
                            class="px-3 py-2 text-xs font-medium rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed border"
                            :class="report.status === 'PENDING' ? 'bg-yellow-100 text-yellow-700 border-yellow-200' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'">
                            <i class="fa-solid fa-hourglass-end mr-1"></i>
                            รอพิจารณา
                        </button>
                        <button @click="quickUpdateStatus('APPROVED')" 
                            :disabled="report.status === 'APPROVED'"
                            class="px-3 py-2 text-xs font-medium rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed border"
                            :class="report.status === 'APPROVED' ? 'bg-green-100 text-green-700 border-green-200' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'">
                            <i class="fa-solid fa-circle-check mr-1"></i>
                            อนุมัติ
                        </button>
                        <button @click="quickUpdateStatus('REJECTED')" 
                            :disabled="report.status === 'REJECTED'"
                            class="px-3 py-2 text-xs font-medium rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed border"
                            :class="report.status === 'REJECTED' ? 'bg-red-100 text-red-700 border-red-200' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'">
                            <i class="fa-solid fa-circle-xmark mr-1"></i>
                            ปฏิเสธ
                        </button>
                        <button @click="quickUpdateStatus('RESOLVED')" 
                            :disabled="report.status === 'RESOLVED'"
                            class="px-3 py-2 text-xs font-medium rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed border"
                            :class="report.status === 'RESOLVED' ? 'bg-blue-100 text-blue-700 border-blue-200' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'">
                            <i class="fa-solid fa-check-double mr-1"></i>
                            แก้ไขแล้ว
                        </button>
                    </div>
                </div>

                <!-- Loading / Error -->
                <div v-if="isLoading" class="text-center py-10 text-gray-500">
                    <i class="fas fa-spinner fa-spin text-2xl mb-3"></i>
                    <p>กำลังโหลด...</p>
                </div>

                <div v-else-if="loadError" class="bg-red-50 border border-red-200 rounded-lg p-6 mb-6">
                    <p class="text-red-700">{{ loadError }}</p>
                </div>

                <!-- Report Details Card -->
                <div v-else-if="report" class="bg-white border border-gray-300 rounded-lg shadow-sm p-6 mb-6">
                    <!-- Header Section -->
                    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-gray-200">
                        <div>
                            <h2 class="text-xl font-semibold text-gray-900">{{ report.description || 'รายงาน' }}</h2>
                        </div>
                        <div class="flex items-center gap-2">
                            <span class="inline-flex items-center px-3 py-1 text-xs font-medium rounded-full"
                                :class="typeBadgeClass(report.type)">
                                {{ report.type }}
                            </span>
                            <span class="inline-flex items-center px-3 py-1 text-xs font-medium rounded-full gap-1"
                                :class="statusBadgeClass(report.status)">
                                <i :class="statusIconClass(report.status)"></i>
                                {{ statusLabelTh(report.status) }}
                            </span>
                        </div>
                    </div>

                    <!-- Reporter Info -->
                    <div class="py-6 border-b border-gray-200">
                        <h3 class="text-sm font-medium text-gray-600 mb-4">ผู้รายงาน</h3>
                        <div class="flex items-center gap-4">
                            <!--  Fixed Avatar Loading -->
                            <img :src="getReporterAvatar(report)" 
                                @error="handleImageError"
                                class="object-cover rounded-full w-12 h-12 bg-gray-200" 
                                alt="avatar" />
                            <div>
                                <p class="font-medium text-gray-900">{{ getReporterName(report) }}</p>
                                <p class="text-sm text-gray-500">{{ getReporterEmail(report) }}</p>
                            </div>
                        </div>
                    </div>

                    <!-- Description -->
                    <div class="py-6 border-b border-gray-200">
                        <h3 class="text-sm font-medium text-gray-600 mb-3">เนื้อหา</h3>
                        <p class="text-gray-700 whitespace-pre-wrap">{{ report.description }}</p>
                    </div>

                    <!-- Additional Info -->
                    <div class="py-6 border-b border-gray-200">
                        <div class="grid grid-cols-2 gap-6">
                            <div>
                                <p class="text-sm text-gray-600 mb-1">ประเภท</p>
                                <p class="font-medium text-gray-900">{{ report.type }}</p>
                            </div>
                            <div>
                                <p class="text-sm text-gray-600 mb-1">หมวดหมู่</p>
                                <p class="font-medium text-gray-900">{{ categoryLabelTh(report.category) }}</p>
                            </div>
                            <div>
                                <p class="text-sm text-gray-600 mb-1">วันที่รายงาน</p>
                                <p class="font-medium text-gray-900">{{ formatDate(report.createdAt) }}</p>
                            </div>
                            <div v-if="report.targetUser">
                                <p class="text-sm text-gray-600 mb-1">ผู้ที่ถูกรายงาน</p>
                                <p class="font-medium text-gray-900">{{ report.targetUser.firstName }} {{ report.targetUser.lastName }}</p>
                            </div>
                            <div v-if="report.routeId">
                                <p class="text-sm text-gray-600 mb-1">Route ID</p>
                                <p class="font-medium text-gray-900">{{ report.routeId }}</p>
                            </div>
                        </div>
                    </div>

                    <!-- Images -->
                    <div v-if="report.images && report.images.length > 0" class="py-6 border-b border-gray-200">
                        <h3 class="text-sm font-medium text-gray-600 mb-3">รูปภาพประกอบ</h3>
                        <div class="grid grid-cols-2 gap-4">
                            <img v-for="(img, idx) in report.images" :key="idx" 
                                :src="img" 
                                class="w-full h-48 object-cover rounded-lg border border-gray-200" 
                                alt="Report image" />
                        </div>
                    </div>

                    <!-- Admin Notes -->
                    <div v-if="report.adminNotes" class="py-6 border-b border-gray-200">
                        <h3 class="text-sm font-medium text-gray-600 mb-3">หมายเหตุจากแอดมิน</h3>
                        <p class="text-gray-700 bg-blue-50 p-4 rounded border border-blue-200">{{ report.adminNotes }}</p>
                    </div>

                    <!-- Resolved Info -->
                    <div v-if="['APPROVED', 'REJECTED', 'RESOLVED'].includes(report.status) || report.resolvedAt" class="py-6">
                        <div class="grid grid-cols-2 gap-6">
                            <div>
                                <p class="text-sm text-gray-600 mb-1">ดำเนินการตรวจสอบเมื่อ</p>
                                <p class="font-medium text-gray-900">{{ formatDate(report.resolvedAt) }}</p>
                            </div>
                            <div v-if="report.resolvedBy">
                                <p class="text-sm text-gray-600 mb-1">ดำเนินการโดย</p>
                                <p class="font-medium text-gray-900">
                                    {{ report.resolvedBy.firstName }} {{ report.resolvedBy.lastName }}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Action Buttons -->
                <div v-if="report" class="flex gap-3">
                    <button @click="goToEdit"
                        class="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
                        <i class="fas fa-edit mr-2"></i>
                        แก้ไขรายงาน (ขั้นสูง)
                    </button>
                    <button @click="askDelete"
                        class="flex-1 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors">
                        <i class="fas fa-trash mr-2"></i>
                        ลบรายงาน
                    </button>
                </div>
            </div>
        </main>

        <!-- Mobile Overlay -->
        <div id="overlay" class="fixed inset-0 z-40 hidden bg-black bg-opacity-50 lg:hidden"
            @click="closeMobileSidebar"></div>

        <!-- Confirm Delete Modal -->
        <ConfirmModal :show="showDelete"
            :title="`ลบรายงาน #${reportId}`"
            message="การลบนี้เป็นการลบถาวร ข้อมูลทั้งหมดจะถูกลบและไม่สามารถกู้คืนได้ คุณต้องการดำเนินการต่อหรือไม่?"
            confirmText="ลบถาวร" cancelText="ยกเลิก" variant="danger" @confirm="confirmDelete"
            @cancel="cancelDelete" />
    </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import dayjs from 'dayjs'
import 'dayjs/locale/th'
import buddhistEra from 'dayjs/plugin/buddhistEra'
import AdminHeader from '~/components/admin/AdminHeader.vue'
import AdminSidebar from '~/components/admin/AdminSidebar.vue'
import ConfirmModal from '~/components/ConfirmModal.vue'
import { useToast } from '~/composables/useToast'
import { useReport } from '~/composables/useReport'

dayjs.locale('th')
dayjs.extend(buddhistEra)

definePageMeta({ middleware: ['admin-auth'] })

const route = useRoute()
const router = useRouter()
const { toast } = useToast()
const { getReportById, deleteReport, updateReportStatus } = useReport()

const reportId = route.params.id
const report = ref(null)
const isLoading = ref(false)
const loadError = ref('')

const showDelete = ref(false)

// --- Fetch Report ---
async function fetchReport() {
    isLoading.value = true
    loadError.value = ''
    try {
        report.value = await getReportById(reportId)
        if (!report.value) {
            loadError.value = 'ไม่พบรายงาน'
        }
    } catch (err) {
        console.error(err)
        loadError.value = err?.message || 'ไม่สามารถโหลดข้อมูลได้'
        toast.error('เกิดข้อผิดพลาด', loadError.value)
    } finally {
        isLoading.value = false
    }
}

// ✅ Helper Functions for Reporter Info
function getReporterName(report) {
    if (report.reporterName) return report.reporterName
    if (report.reporter) {
        return `${report.reporter.firstName || ''} ${report.reporter.lastName || ''}`.trim() || 'ไม่ระบุชื่อ'
    }
    return 'ไม่ระบุชื่อ'
}

function getReporterEmail(report) {
    if (report.reporterEmail) return report.reporterEmail
    if (report.reporter?.email) return report.reporter.email
    return 'ไม่มีข้อมูล'
}

function getReporterAvatar(report) {
    // Priority: reporterAvatar > reporter.profilePicture > reporter.avatar > fallback
    const avatar = report.reporterAvatar || report.reporter?.profilePicture || report.reporter?.avatar
    if (avatar) return avatar
    
    // Fallback to UI Avatars
    const name = getReporterName(report)
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random&size=128`
}

function handleImageError(event) {
    event.target.src = 'https://ui-avatars.com/api/?name=User&background=random&size=128'
}

//  Quick Status Update Function
async function quickUpdateStatus(newStatus) {
    if (!report.value || report.value.status === newStatus) return
    
    try {
        isLoading.value = true
        await updateReportStatus(reportId, newStatus, '')
        toast.success('อัปเดตสถานะสำเร็จ', `เปลี่ยนสถานะเป็น ${statusLabelTh(newStatus)}`)
        await fetchReport() // Refresh data
    } catch (err) {
        console.error(err)
        toast.error('อัปเดตสถานะไม่สำเร็จ', err?.message || 'เกิดข้อผิดพลาด')
    } finally {
        isLoading.value = false
    }
}

// --- Helper Functions ---
function typeBadgeClass(type) {
    const badges = {
        'DRIVER': 'bg-blue-100 text-blue-700',
        'PASSENGER': 'bg-green-100 text-green-700',
        'USER': 'bg-green-100 text-green-700',
        'BOOKING': 'bg-purple-100 text-purple-700',
        'OTHER': 'bg-gray-100 text-gray-700'
    }
    return badges[type] || 'bg-gray-100 text-gray-700'
}

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

function categoryLabelTh(cat) {
    const labels = {
        VEHICLE_ISSUE: 'ปัญหาสภาพรถ/ข้อมูลรถไม่ตรง',
        SAFETY_ISSUE: 'พฤติกรรมการขับขี่ที่ไม่ปลอดภัย',
        PAYMENT_ISSUE: 'ปัญหาเรื่องการจ่ายเงิน',
        PASSENGER_ISSUE: 'พฤติกรรมผู้โดยสาร/ผู้ร่วมทริป',
        NO_SHOW: 'ผู้โดยสารไม่มาพบตามจุดนัดหมาย',
        ROAD_ISSUE: 'ปัญหาเรื่องถนน/สภาพแวดล้อม',
        OTHER: 'อื่น ๆ'
    }
    return labels[cat] || cat || '-'
}

function formatDate(iso) {
    if (!iso) return '-'
    return dayjs(iso).format('D MMMM BBBB HH:mm')
}

// --- Navigation ---
function goBack() {
    router.back()
}

function goToEdit() {
    router.push(`/admin/reports/${reportId}/edit`)
}

// --- Delete Report ---
function askDelete() {
    showDelete.value = true
}

function cancelDelete() {
    showDelete.value = false
}

async function confirmDelete() {
    try {
        await deleteReport(reportId)
        toast.success('ลบรายงานเรียบร้อย', `รายงาน #${reportId} ถูกลบถาวรแล้ว`)
        cancelDelete()
        router.push('/admin/reports')
    } catch (err) {
        console.error(err)
        const msg = err?.message || 'ลบไม่สำเร็จ'
        toast.error('ลบไม่สำเร็จ', msg)
    }
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
    title: `Report #${reportId} - TailAdmin Dashboard`,
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