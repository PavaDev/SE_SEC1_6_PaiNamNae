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
                        <div class="flex items-center justify-between gap-4">
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
                            <button v-if="report.reporter" @click="onViewReviews(report.reporter)" 
                                class="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-yellow-700 bg-yellow-50 border border-yellow-200 rounded-lg hover:bg-yellow-100 transition-colors">
                                <i class="fa-regular fa-star"></i>
                                ดูรีวิวผู้ใช้งาน
                            </button>
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
                                <div class="flex items-center justify-between gap-2">
                                    <p class="font-medium text-gray-900">{{ report.targetUser.firstName }} {{ report.targetUser.lastName }}</p>
                                    <button @click="onViewReviews(report.targetUser)" 
                                        class="inline-flex items-center gap-1.5 px-2 py-1 text-[10px] font-bold text-yellow-700 bg-yellow-50 border border-yellow-200 rounded-md hover:bg-yellow-100 transition-colors uppercase">
                                        <i class="fa-regular fa-star"></i>
                                        ดูรีวิว
                                    </button>
                                </div>
                            </div>
                            <div v-if="report.routeId">
                                <p class="text-sm text-gray-600 mb-1">Route ID</p>
                                <p class="font-medium text-gray-900">{{ report.routeId }}</p>
                            </div>
                        </div>
                    </div>

                    <!-- Route Details Context -->
                    <div v-if="report.route" class="py-6 border-b border-gray-200 bg-slate-50/50 -mx-6 px-6">
                        <h3 class="text-sm font-semibold text-gray-800 mb-4 flex items-center gap-2">
                            <i class="fa-solid fa-route text-blue-500"></i>
                            รายละเอียดเส้นทาง (Route Context)
                        </h3>
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <!-- Start/End -->
                            <div class="space-y-3">
                                <div class="flex items-start gap-3">
                                    <div class="flex flex-col items-center gap-1 mt-1">
                                        <div class="w-2.5 h-2.5 rounded-full border-2 border-emerald-500"></div>
                                        <div class="w-0.5 h-6 bg-gray-200"></div>
                                        <div class="w-2.5 h-2.5 rounded-full bg-red-500"></div>
                                    </div>
                                    <div class="flex-1 space-y-3">
                                        <div>
                                            <p class="text-[10px] font-bold text-gray-400 uppercase leading-none mb-1">จุดเริ่มต้น</p>
                                            <p class="text-sm text-gray-700 font-medium">{{ report.route.startLocation?.name || 'ไม่ระบุ' }}</p>
                                        </div>
                                        <div>
                                            <p class="text-[10px] font-bold text-gray-400 uppercase leading-none mb-1">จุดหมาย</p>
                                            <p class="text-sm text-gray-700 font-medium">{{ report.route.endLocation?.name || 'ไม่ระบุ' }}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            <!-- Driver & Vehicle -->
                            <div class="space-y-4">
                                <div v-if="report.route.driver" class="flex items-center gap-3 p-2 rounded-lg bg-white border border-gray-100">
                                    <img :src="report.route.driver.profilePicture || `https://ui-avatars.com/api/?name=${encodeURIComponent(report.route.driver.firstName)}&background=random`" 
                                        class="w-10 h-10 rounded-full border border-gray-100" />
                                    <div>
                                        <p class="text-xs font-bold text-gray-400 uppercase mb-0.5">คนขับ (Driver)</p>
                                        <p class="text-sm font-semibold text-gray-900">{{ report.route.driver.firstName }} {{ report.route.driver.lastName }}</p>
                                    </div>
                                </div>
                                
                                <div v-if="report.route.vehicle" class="p-3 rounded-lg bg-white border border-gray-100">
                                    <p class="text-[10px] font-bold text-gray-400 uppercase mb-1.5">ยานพาหนะ (Vehicle)</p>
                                    <div class="flex items-center gap-2">
                                        <span class="px-2 py-0.5 bg-gray-100 text-gray-700 rounded text-xs font-mono font-bold border border-gray-200">
                                            {{ report.route.vehicle.licensePlate }}
                                        </span>
                                        <span class="text-sm text-gray-600">
                                            {{ report.route.vehicle.color }} {{ report.route.vehicle.vehicleModel }}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Media Files (Images, Video, Audio) -->
                    <div v-if="report.images && report.images.length > 0" class="py-6 border-b border-gray-200">
                        <h3 class="text-sm font-medium text-gray-600 mb-4">ไฟล์แนบประกอบ ({{ report.images.length }})</h3>
                        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div v-for="(fileUrl, idx) in report.images" :key="idx" class="relative group">
                                <!-- Image Renderer -->
                                <template v-if="isImage(fileUrl)">
                                    <img :src="fileUrl" 
                                        class="w-full h-64 object-cover rounded-lg border border-gray-200 shadow-sm cursor-zoom-in hover:brightness-95 transition-all" 
                                        alt="Report image" 
                                        @click="window.open(fileUrl, '_blank')" />
                                </template>
                                
                                <!-- Video Renderer -->
                                <template v-else-if="isVideo(fileUrl)">
                                    <div class="rounded-lg border border-gray-200 bg-black overflow-hidden shadow-sm">
                                        <video controls class="w-full h-64">
                                            <source :src="fileUrl" />
                                            เบราว์เซอร์ของคุณไม่รองรับการเล่นวิดีโอ
                                        </video>
                                    </div>
                                </template>

                                <!-- Audio Renderer -->
                                <template v-else-if="isAudio(fileUrl)">
                                    <div class="p-6 rounded-lg border border-gray-200 bg-slate-50 flex flex-col items-center justify-center shadow-sm">
                                        <div class="mb-3 text-emerald-600">
                                            <i class="fa-solid fa-microphone-lines text-3xl"></i>
                                        </div>
                                        <audio controls class="w-full">
                                            <source :src="fileUrl" />
                                            เบราว์เซอร์ของคุณไม่รองรับการเล่นเสียง
                                        </audio>
                                        <p class="mt-2 text-xs text-slate-500 font-medium">ไฟล์เสียงแนบ (Audio Evidence)</p>
                                    </div>
                                </template>

                                <!-- Unknown / Fallback -->
                                <template v-else>
                                    <a :href="fileUrl" target="_blank" class="p-6 rounded-lg border border-gray-200 bg-slate-100 flex flex-col items-center justify-center hover:bg-slate-200 transition-colors shadow-sm">
                                        <i class="fa-solid fa-file-arrow-down text-3xl text-slate-400 mb-2"></i>
                                        <span class="text-sm text-slate-600 font-medium">ดาวน์โหลดไฟล์แนบ</span>
                                    </a>
                                </template>
                            </div>
                        </div>
                        <p class="mt-4 text-xs text-gray-500 italic">
                            <i class="fa-solid fa-circle-info mr-1"></i>
                            คลิกที่รูปภาพเพื่อดูขนาดเต็ม หรือใช้ปุ่มควบคุมวิดีโอ/เสียงเพื่อตรวจสอบหลักฐาน
                        </p>
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

                <!-- Audit Action Card -->
                <div v-if="report" class="bg-white border border-gray-300 rounded-lg shadow-sm p-6 mb-6">
                    <h3 class="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
                        <i class="fa-solid fa-gavel text-blue-600"></i>
                        การตรวจสอบและดำเนินการ
                    </h3>
                    
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6 pb-6 border-b border-gray-100">
                        <!-- Status Selection -->
                        <div>
                            <label class="block mb-2 text-sm font-medium text-gray-700">สถานะ <span class="text-red-500">*</span></label>
                            <select v-model="formData.status"
                                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white">
                                <option value="PENDING">รอพิจารณา (Pending)</option>
                                <option value="APPROVED">รับเรื่อง (Approved)</option>
                                <option value="REJECTED">ปฏิเสธ (Rejected)</option>
                                <option value="RESOLVED">แก้ไขแล้ว (Resolved)</option>
                            </select>
                            <p class="text-xs text-gray-500 mt-2">
                                <i class="fa-solid fa-circle-info mr-1"></i>
                                เลือกสถานะที่เหมาะสมเพื่อดำเนินการต่อ
                            </p>
                        </div>
                        
                        <!-- Quick Stats / Helper -->
                        <div class="bg-gray-50 p-4 rounded-lg border border-gray-200">
                            <h4 class="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">สรุปการตรวจสอบ</h4>
                            <div class="space-y-2">
                                <div class="flex justify-between text-sm">
                                    <span class="text-gray-600">สถานะปัจจุบัน:</span>
                                    <span :class="statusBadgeClass(report.status)" class="px-2 py-0.5 rounded-full text-xs font-medium">
                                        {{ statusLabelTh(report.status) }}
                                    </span>
                                </div>
                                <div class="flex justify-between text-sm">
                                    <span class="text-gray-600">แก้ไขล่าสุด:</span>
                                    <span class="text-gray-900 font-medium">{{ formatDate(report.updatedAt) }}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Admin Notes -->
                    <div class="mb-6">
                        <label class="block mb-2 text-sm font-medium text-gray-700">หมายเหตุจากแอดมิน (Admin Notes)</label>
                        <textarea v-model="formData.adminNotes" rows="4"
                            placeholder="ระบุเหตุผลในการตัดสินใจ หรือรายละเอียดการดำเนินการเพิ่มเติม..."
                            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"></textarea>
                        <div class="flex justify-between mt-1">
                            <p class="text-xs text-gray-500">หมายเหตุนี้จะถูกบันทึกไว้ในระบบเพื่อใช้ในการอ้างอิง</p>
                            <p class="text-xs text-gray-500">{{ formData.adminNotes.length }} / 2000</p>
                        </div>
                    </div>

                    <!-- Action Buttons -->
                    <div class="flex flex-col sm:flex-row gap-3 pt-4">
                        <button @click="submitUpdate" :disabled="isSubmitting"
                            class="flex-1 px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm flex items-center justify-center gap-2 font-medium">
                            <i class="fas fa-save" v-if="!isSubmitting"></i>
                            <i class="fas fa-spinner fa-spin" v-else></i>
                            <span>{{ isSubmitting ? 'กำลังบันทึก...' : 'บันทึกการเปลี่ยนแปลง' }}</span>
                        </button>
                        
                        <button @click="askDelete" :disabled="isSubmitting"
                            class="px-6 py-2.5 bg-white text-red-600 border border-red-200 rounded-lg hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 font-medium">
                            <i class="fas fa-trash"></i>
                            <span>ลบรายงาน</span>
                        </button>
                    </div>
                </div>
            </div>
        </main>

        <!-- Mobile Overlay -->
        <div id="overlay" class="fixed inset-0 z-40 hidden bg-black bg-opacity-50 lg:hidden"
            @click="closeMobileSidebar"></div>

        <!-- User Reviews Modal -->
        <Transition name="modal-fade">
            <div v-if="showReviewModal" class="fixed inset-0 z-[100] flex items-center justify-center p-4 backdrop-blur-md bg-white/30">
                <div class="bg-white rounded-lg shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col modal-content border border-white/50">
                    <!-- Header -->
                    <div class="flex items-center justify-between px-6 py-4 border-b">
                        <div>
                            <h3 class="text-lg font-semibold text-gray-900">รีวิวของ {{ selectedUserForReviews?.firstName }} {{ selectedUserForReviews?.lastName }}</h3>
                            <div class="flex text-yellow-400">
                                <template v-for="i in 5" :key="i">
                                    <span v-if="i <= Math.floor(selectedUserForReviews?.ratingAverage || 0)">★</span>
                                    <span v-else-if="i <= Math.ceil(selectedUserForReviews?.ratingAverage || 0) && (selectedUserForReviews?.ratingAverage || 0) % 1 > 0" class="relative">
                                        <span class="absolute overflow-hidden w-1/2">★</span>
                                        <span class="text-gray-300">★</span>
                                    </span>
                                    <span v-else class="text-gray-300">★</span>
                                </template>
                                <span class="ml-2 text-gray-600">
                                    ({{ selectedUserForReviews?.ratingAverage ? selectedUserForReviews.ratingAverage.toFixed(1) : '0.0' }})
                                </span>
                            </div>
                            <p class="text-sm text-gray-500">ทั้งหมด {{ userReviews.length }} รายการ</p>
                        </div>
                        <button @click="closeReviewModal" class="text-gray-400 hover:text-gray-600">
                            <i class="fa-solid fa-xmark text-xl"></i>
                        </button>
                    </div>

                    <!-- Body -->
                    <div class="flex-1 overflow-y-auto p-6">
                        <div v-if="isLoadingUserReviews" class="py-12 text-center text-gray-500">
                            <i class="fa-solid fa-circle-notch fa-spin text-3xl mb-3"></i>
                            <p>กำลังโหลดรีวิว...</p>
                        </div>
                        
                        <div v-else-if="userReviews.length === 0" class="py-12 text-center text-gray-500">
                            <i class="fa-regular fa-comment-dots text-4xl mb-3 text-gray-300"></i>
                            <p>ไม่พบรายการรีวิว</p>
                        </div>

                        <div v-else class="space-y-6">
                            <div v-for="review in userReviews" :key="review.id" class="p-4 border border-gray-100 rounded-xl bg-gray-50/50">
                                <div class="flex items-start gap-4">
                                    <img :src="review.reviewer?.profilePicture || `https://ui-avatars.com/api/?name=${encodeURIComponent(review.reviewer?.firstName || 'U')}&background=random`" 
                                        class="w-10 h-10 rounded-full border border-gray-200" />
                                    <div class="flex-1">
                                        <div class="flex items-center justify-between">
                                            <span class="font-medium text-gray-900">{{ review.reviewer?.firstName }} {{ review.reviewer?.lastName }}</span>
                                            <span class="text-xs text-gray-400">{{ dayjs(review.createdAt).format('D MMM BBBB') }}</span>
                                        </div>
                                        <div class="flex items-center mt-0.5 text-yellow-400 text-sm">
                                            <span v-for="i in 5" :key="i">{{ i <= review.rating ? '★' : '☆' }}</span>
                                        </div>
                                        <p class="mt-2 text-sm text-gray-700 leading-relaxed">{{ review.comment }}</p>

                                        <!-- Review Categories -->
                                        <div v-if="review.categories && review.categories.length" class="flex flex-wrap gap-1.5 mt-2">
                                            <span v-for="cat in review.categories" :key="cat" 
                                                class="px-2 py-0.5 bg-blue-50 text-blue-600 rounded text-[10px] font-medium border border-blue-100">
                                                {{ reviewCategoryLabelTh(cat) }}
                                            </span>
                                        </div>
                                        
                                        <!-- Review Images -->
                                        <div v-if="review.images && review.images.length" class="grid grid-cols-4 gap-2 mt-3">
                                            <img v-for="(img, idx) in review.images" :key="idx" :src="img" 
                                                class="w-full aspect-square object-cover rounded-md border border-gray-200" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Footer -->
                    <div class="px-6 py-4 border-t bg-gray-50 flex justify-end">
                        <button @click="closeReviewModal" class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50">
                            ปิดหน้าต่าง
                        </button>
                    </div>
                </div>
            </div>
        </Transition>
        <!-- Confirm Delete Modal -->
        <ConfirmModal :show="showDelete"
            :title="`ลบรายงาน #${reportId}`"
            message="การลบนี้เป็นการลบถาวร ข้อมูลทั้งหมดจะถูกลบและไม่สามารถกู้คืนได้ คุณต้องการดำเนินการต่อหรือไม่?"
            confirmText="ลบถาวร" cancelText="ยกเลิก" variant="danger" @confirm="confirmDelete"
            @cancel="cancelDelete" />
    </div>
</template>

<script setup>
import { ref, reactive, onMounted, onUnmounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useRuntimeConfig, useCookie } from '#app'
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
const isLoadingUserReviews = ref(false)
const loadError = ref('')
const isSubmitting = ref(false)

const showReviewModal = ref(false)
const selectedUserForReviews = ref(null)
const userReviews = ref([])

const showDelete = ref(false)

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
            // Initialize form data
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

// Helper Functions for Reporter Info
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

// --- Submit Update ---
async function submitUpdate() {
    if (!formData.status) {
        toast.error('ข้อผิดพลาด', 'กรุณาเลือกสถานะ')
        return
    }

    isSubmitting.value = true
    try {
        await updateReportStatus(reportId, formData.status, formData.adminNotes)
        toast.success('บันทึกสำเร็จ', 'อัปเดตข้อมูลรายงานเรียบร้อย')
        await fetchReport() // Refresh data
    } catch (err) {
        console.error(err)
        const msg = err?.message || 'ไม่สามารถอัปเดตได้'
        toast.error('อัปเดตไม่สำเร็จ', msg)
    } finally {
        isSubmitting.value = false
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
        'APPROVED': 'bg-blue-100 text-blue-700',
        'REJECTED': 'bg-red-100 text-red-700',
        'RESOLVED': 'bg-green-100 text-green-700'
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
        'APPROVED': 'รับเรื่อง',
        'REJECTED': 'ปฏิเสธ',
        'RESOLVED': 'แก้ไขแล้ว'
    }
    return labels[status] || status
}

// Media Type Helpers
function isImage(url) {
    if (!url) return false
    const ext = url.split('.').pop().toLowerCase().split('?')[0]
    const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp']
    return imageExtensions.includes(ext) || url.includes('/image/upload/')
}

function isVideo(url) {
    if (!url) return false
    const ext = url.split('.').pop().toLowerCase().split('?')[0]
    const videoExtensions = ['mp4', 'webm', 'ogg', 'mov', 'wmv', 'avi']
    return videoExtensions.includes(ext) || url.includes('/video/upload/')
}

function isAudio(url) {
    if (!url) return false
    const ext = url.split('.').pop().toLowerCase().split('?')[0]
    const audioExtensions = ['mp3', 'wav', 'ogg', 'm4a', 'aac']
    return audioExtensions.includes(ext)
}

function categoryLabelTh(cat) {
    const labels = {
        VEHICLE_ISSUE: 'ปัญหาสภาพรถ/ข้อมูลรถไม่ตรง',
        SAFETY_ISSUE: 'พฤติกรรมการขับขี่ที่ไม่ปลอดภัย',
        PAYMENT_ISSUE: 'ปัญหาเรื่องการจ่ายเงิน',
        PASSENGER_ISSUE: 'พฤติกรรมไม่เหมาะสม',
        LATE_ISSUE: 'ความล่าช้า',
        WRONG_INFO: 'ข้อมูลไม่ตรงตามที่ระบุ',
        APP_ISSUE: 'ปัญหาการใช้งานแอปพลิเคชัน',
        NO_SHOW: 'ผู้โดยสารไม่มาพบตามจุดนัดหมาย',
        ROAD_ISSUE: 'ปัญหาเรื่องถนน/สภาพแวดล้อม',
        OTHER: 'อื่น ๆ'
    }
    return labels[cat] || cat || '-'
}

function reviewCategoryLabelTh(cat) {
    const labels = {
        GOOD_DRIVING: 'ขับรถดี',
        POLITE: 'คนขับสุภาพ',
        ON_TIME: 'มาตรงเวลา',
        CLEAN_CAR: 'รถสะอาด',
        SAFE_DRIVING: 'ขับปลอดภัย',
        GOOD_COMMUNICATION: 'สื่อสารดี',
        FAIR_PRICE: 'ราคายุติธรรม'
    }
    return labels[cat] || cat
}

function formatDate(iso) {
    if (!iso) return '-'
    return dayjs(iso).format('D MMMM BBBB HH:mm')
}

// --- Navigation ---
function goBack() {
    router.back()
}

// --- User Reviews Modal Logic ---
function onViewReviews(user) {
    selectedUserForReviews.value = user
    showReviewModal.value = true
    fetchUserReviews(user.id)
}

function closeReviewModal() {
    showReviewModal.value = false
    selectedUserForReviews.value = null
    userReviews.value = []
}

async function fetchUserReviews(userId) {
    isLoadingUserReviews.value = true
    try {
        const config = useRuntimeConfig()
        const token = useCookie('token').value || (process.client ? localStorage.getItem('token') : '')
        
        const res = await fetch(`${config.public.apiBase}/reviews/received/${userId}`, {
            headers: {
                Accept: 'application/json',
                ...(token ? { Authorization: `Bearer ${token}` } : {})
            },
            credentials: 'include'
        })
        
        if (res.status === 404) {
            userReviews.value = []
            return
        }
        
        const body = await res.json()
        if (res.ok) {
            userReviews.value = body.data || []
        }
    } catch (err) {
        console.error('Failed to fetch user reviews:', err)
        userReviews.value = []
    } finally {
        isLoadingUserReviews.value = false
    }
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
.modal-fade-enter-active, .modal-fade-leave-active {
    transition: all 0.3s ease;
}
.modal-fade-enter-from, .modal-fade-leave-to {
    opacity: 0;
    transform: scale(0.95);
}

.modal-content {
    animation: modal-pop 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

@keyframes modal-pop {
    0% { transform: scale(0.9); opacity: 0; }
    100% { transform: scale(1); opacity: 1; }
}

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