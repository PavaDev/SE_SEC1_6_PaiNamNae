<template>
  <div class="bg-gray-50">
    <div class="flex items-center justify-center min-h-screen py-8">
      <div class="flex w-full max-w-6xl mx-4 overflow-hidden bg-white border border-gray-300 rounded-lg shadow-lg">
        <!-- Sidebar -->
        <ProfileSidebar />

        <!-- Main Content -->
        <main class="flex-1 p-8 min-w-0">
          <div class="flex items-center justify-between mb-8">
            <h2 class="text-2xl font-bold tracking-tight text-gray-900">รีวิวของฉัน</h2>
            <div class="px-4 py-2 bg-blue-50 text-blue-700 rounded-xl font-medium text-sm">
              {{ isDriver ? 'รีวิวที่คุณได้รับ' : 'รีวิวที่คุณให้' }}
            </div>
          </div>

          <!-- Overview Stats -->
          <div v-if="reviews.length > 0" class="grid grid-cols-2 md:grid-cols-2 gap-4 mb-8">
            <!-- stats content remains same -->
            <div class="p-4 bg-gray-50 rounded-2xl border border-gray-100 flex flex-col justify-center items-center">
              <div class="text-xs text-gray-500 font-bold uppercase tracking-wider mb-1">คะแนนเฉลี่ย</div>
              <div class="text-3xl font-black text-gray-900 flex items-center gap-1">
                {{ averageRating.toFixed(1) }} <span class="text-yellow-400 text-2xl leading-none">★</span>
              </div>
            </div>
            <div class="p-4 bg-gray-50 rounded-2xl border border-gray-100 flex flex-col justify-center items-center">
              <div class="text-xs text-gray-500 font-bold uppercase tracking-wider mb-1">รีวิวทั้งหมด</div>
              <div class="text-3xl font-black text-gray-900">{{ reviews.length }}</div>
            </div>
            
          </div>

          <!-- Filters -->
          <div class="mb-8 space-y-4 bg-gray-50 p-4 rounded-2xl border border-gray-100">
            <!-- Filter content remains same -->
            <!-- Star Filters -->
            <div>
              <div class="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">กรองตามคะแนน (ดาว)</div>
              <div class="flex flex-wrap gap-2">
                <button class="px-3 py-1.5 rounded-full text-sm font-medium transition-colors border"
                    :class="filterRating === null ? 'bg-blue-100 text-blue-700 border-blue-200 shadow-sm' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-100'"
                    @click="filterRating = null">
                    ทั้งหมด
                </button>
                <button v-for="star in 5" :key="'star-'+star" 
                    v-show="ratingCounts[star] > 0 || filterRating === star"
                    class="px-3 py-1.5 rounded-full text-sm font-medium transition-colors border flex items-center gap-1"
                    :class="filterRating === star ? 'bg-blue-100 text-blue-700 border-blue-200 shadow-sm' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-100'"
                    @click="filterRating === star ? filterRating = null : filterRating = star">
                    {{ star }} <span class="text-yellow-400 text-base leading-none">★</span>
                    <span class="ml-1 text-xs px-1.5 py-0.5 rounded-md" :class="filterRating === star ? 'bg-blue-200' : 'bg-gray-100 text-gray-500'">{{ ratingCounts[star] }}</span>
                </button>
              </div>
            </div>
            
            <!-- Category Filters -->
            <div>
              <div class="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">กรองตามจุดเด่น</div>
              <div class="flex flex-wrap gap-2">
                <button class="px-3 py-1.5 rounded-full text-sm font-medium transition-colors border"
                    :class="filterCategory === null ? 'bg-green-100 text-green-700 border-green-200 shadow-sm' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-100'"
                    @click="filterCategory = null">
                    ทั้งหมด
                </button>
                <button v-for="cat in availableCategories" :key="'cat-'+cat.value" 
                    class="px-3 py-1.5 rounded-full text-sm font-medium transition-colors border flex items-center gap-1.5"
                    :class="filterCategory === cat.value ? 'bg-green-100 text-green-700 border-green-200 shadow-sm' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-100'"
                    @click="filterCategory === cat.value ? filterCategory = null : filterCategory = cat.value">
                    {{ cat.label }}
                    <span class="text-xs px-1.5 py-0.5 rounded-md" :class="filterCategory === cat.value ? 'bg-green-200 text-green-800' : 'bg-gray-100 text-gray-500'">{{ cat.count }}</span>
                </button>
              </div>
            </div>
          </div>

          <!-- Review List -->
          <div v-if="isLoading" class="py-12 flex flex-col items-center justify-center text-gray-400 space-y-4">
            <svg class="animate-spin h-8 w-8 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
            <span class="font-medium">กำลังโหลดข้อมูล...</span>
          </div>

          <div v-else-if="filteredReviews.length === 0" class="py-16 text-center border-2 border-dashed border-gray-100 rounded-2xl bg-gray-50 flex flex-col items-center justify-center">
            <div class="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm mb-4">
                <svg class="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/></svg>
            </div>
            <h3 class="text-lg font-bold text-gray-900 mb-1">{{ reviews.length === 0 ? 'ยังไม่มีรีวิว' : 'ไม่พบรีวิว' }}</h3>
            <p class="text-gray-500 text-sm max-w-sm">{{ reviews.length === 0 ? 'ดูเหมือนว่าคุณยังไม่มีข้อมูลหรือประวัติการรีวิวในขณะนี้' : 'ไม่พบข้อมูลรีวิวที่ตรงกับตัวกรองที่คุณเลือก ลองปรับตัวกรองใหม่ดูนะ' }}</p>
          </div>

          <div v-else class="space-y-5">
            <div v-for="review in filteredReviews" :key="review.id" class="p-6 bg-white border border-gray-100 rounded-2xl shadow-sm hover:shadow-md transition-shadow group relative overflow-hidden">
                <!-- Trip Info Bar -->
                <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 mb-4 border-b border-gray-100">
                    <div class="flex items-center gap-3">
                        <div class="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path></svg>
                        </div>
                        <div>
                            <div class="text-sm font-bold text-gray-900 flex items-center gap-2">
                                <span class="truncate max-w-[120px]">{{ extractCity(review.booking?.route?.startLocation) }}</span>
                                <svg class="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3"/></svg>
                                <span class="truncate max-w-[120px]">{{ extractCity(review.booking?.route?.endLocation) }}</span>
                            </div>
                            <div class="text-xs text-gray-500 mt-0.5">{{ formatDateTime(review.createdAt) }}</div>
                        </div>
                    </div>
                    <div class="flex items-center gap-1 text-yellow-400 bg-yellow-50 px-3 py-1.5 rounded-lg border border-yellow-100 w-fit">
                        <span class="text-xs font-black text-yellow-700 mr-1">{{ review.rating }}.0</span>
                        <template v-for="i in 5" :key="i">
                            <span v-if="i <= review.rating" class="text-sm leading-none">★</span>
                            <span v-else class="text-yellow-200 text-sm leading-none">★</span>
                        </template>
                    </div>
                </div>

                <!-- Review Content -->
                <div class="flex gap-4">
                    <!-- User Avatar -->
                    <div class="shrink-0 flex flex-col items-center">
                        <img :src="getOtherParty(review).profilePicture || `https://ui-avatars.com/api/?name=${encodeURIComponent(getOtherParty(review).firstName)}&background=random`" 
                             class="w-12 h-12 rounded-full object-cover border-2 border-white shadow-sm" />
                        <span class="text-[10px] font-bold text-gray-500 mt-1 uppercase tracking-wider">{{ isDriver ? 'รีวิวจาก' : 'รีวิวให้' }}</span>
                    </div>
                    
                    <div class="flex-1">
                        <div class="font-bold text-gray-900 mb-0.5">{{ getOtherParty(review).firstName }} {{ getOtherParty(review).lastName }}</div>
                        
                        <p v-if="review.comment" class="text-sm text-gray-700 whitespace-pre-line leading-relaxed mb-3">
                            {{ review.comment }}
                        </p>
                        <p v-else class="text-sm text-gray-400 italic mb-3">ไม่ได้ระบุความคิดเห็น</p>

                        <!-- Categories -->
                        <div v-if="review.categories && review.categories.length > 0" class="flex flex-wrap gap-1.5 mb-3">
                            <span v-for="catValue in review.categories" :key="catValue" 
                                class="px-2.5 py-1 bg-gray-50 text-gray-600 text-[11px] font-medium rounded-lg border border-gray-200 flex items-center gap-1 hover:bg-gray-100 transition-colors cursor-default">
                                <svg class="w-3 h-3 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>
                                {{ getCategoryLabel(catValue) }}
                            </span>
                        </div>

                        <!-- Images -->
                        <div v-if="review.images && review.images.length > 0" class="flex gap-2 mt-2">
                            <a v-for="(img, idx) in review.images" :key="idx" :href="img" target="_blank" class="block relative w-16 h-16 rounded-lg overflow-hidden border border-gray-200 shadow-sm group/img">
                                <img :src="img" class="w-full h-full object-cover transition-transform group-hover/img:scale-110" />
                                <div class="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center">
                                    <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7"/></svg>
                                </div>
                            </a>
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
import { ref, computed, onMounted } from 'vue'
import dayjs from 'dayjs'
import 'dayjs/locale/th'
import buddhistEra from 'dayjs/plugin/buddhistEra'
import ProfileSidebar from '~/components/ProfileSidebar.vue'
import { useAuth } from '~/composables/useAuth'

dayjs.locale('th')
dayjs.extend(buddhistEra)

const { user } = useAuth()
const { $api } = useNuxtApp()

const isLoading = ref(true)
const reviews = ref([])
const filterRating = ref(null)
const filterCategory = ref(null)

const isDriver = computed(() => user.value?.role === 'DRIVER')

const reviewCategoriesConfig = [
    { value: 'GOOD_DRIVING', label: 'ขับรถดี' },
    { value: 'POLITE', label: 'คนขับสุภาพ' },
    { value: 'ON_TIME', label: 'มาตรงเวลา' },
    { value: 'CLEAN_CAR', label: 'รถสะอาด' },
    { value: 'SAFE_DRIVING', label: 'ขับปลอดภัย' },
    { value: 'GOOD_COMMUNICATION', label: 'สื่อสารดี' },
    { value: 'FAIR_PRICE', label: 'ราคายุติธรรม' }
]

function getCategoryLabel(val) {
    const found = reviewCategoriesConfig.find(c => c.value === val)
    return found ? found.label : val
}

const fetchReviews = async () => {
    isLoading.value = true
    try {
        // If passenger, get reviews they GAVE. If driver, get reviews they RECEIVED.
        const endpoint = isDriver.value ? '/reviews/received' : '/reviews'
        const res = await $api(endpoint)
        reviews.value = res || []
    } catch (error) {
        console.error('Failed to fetch reviews:', error)
    } finally {
        isLoading.value = false
    }
}

onMounted(() => {
    fetchReviews()
})

const filteredReviews = computed(() => {
    return reviews.value.filter(review => {
        let matchRating = true
        let matchCategory = true
        
        if (filterRating.value !== null) {
            matchRating = review.rating === filterRating.value
        }
        
        if (filterCategory.value !== null) {
            matchCategory = review.categories && review.categories.includes(filterCategory.value)
        }
        
        return matchRating && matchCategory
    }).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)) // Newest first
})

// Stats Computations
const averageRating = computed(() => {
    if (reviews.value.length === 0) return 0
    const sum = reviews.value.reduce((acc, rev) => acc + rev.rating, 0)
    return sum / reviews.value.length
})

const ratingCounts = computed(() => {
    const counts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
    reviews.value.forEach(rev => {
        if (counts[rev.rating] !== undefined) counts[rev.rating]++
    })
    return counts
})

const ratingPercentages = computed(() => {
    const total = reviews.value.length
    if (total === 0) return { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
    const counts = ratingCounts.value
    return {
        1: (counts[1] / total) * 100,
        2: (counts[2] / total) * 100,
        3: (counts[3] / total) * 100,
        4: (counts[4] / total) * 100,
        5: (counts[5] / total) * 100
    }
})

function getRatingColorClass(star) {
    if (star === 5) return 'bg-green-500'
    if (star === 4) return 'bg-green-400'
    if (star === 3) return 'bg-yellow-400'
    if (star === 2) return 'bg-amber-500'
    return 'bg-red-500'
}

const availableCategories = computed(() => {
    // Only show categories that have at least one review containing them
    const categoryCounts = {}
    reviews.value.forEach(rev => {
        if (rev.categories && Array.isArray(rev.categories)) {
            rev.categories.forEach(cat => {
                categoryCounts[cat] = (categoryCounts[cat] || 0) + 1
            })
        }
    })
    
    return reviewCategoriesConfig.map(config => ({
        ...config,
        count: categoryCounts[config.value] || 0
    })).filter(cat => cat.count > 0).sort((a, b) => b.count - a.count)
})

// Helpers
function getOtherParty(review) {
    return isDriver.value ? review.reviewer : review.reviewee
}

function formatDateTime(dateStr) {
    if (!dateStr) return ''
    return dayjs(dateStr).format('D MMM BBBB HH:mm น.')
}

function extractCity(loc) {
    if (!loc) return 'ไม่ระบุ'
    let name = loc.name || loc.address || ''
    // try to get just the province/city part for brevity
    if (name.includes(',')) {
        const parts = name.split(',')
        return parts[parts.length - 1].trim().replace('Thailand', '').replace('ประเทศไทย', '').trim() || parts[0]
    }
    return name
}

</script>
