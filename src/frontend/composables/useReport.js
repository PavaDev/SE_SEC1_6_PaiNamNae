import { ref, reactive, computed } from 'vue'
import { useNuxtApp } from '#app'

export function useReport() {
  const { $api } = useNuxtApp()

  // --- State ---
  const reports = ref([])
  const isLoading = ref(false)
  const loadError = ref('')

  const pagination = reactive({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 1
  })

  const filters = reactive({
    q: '',
    type: '',
    status: '',
    dateFrom: '',
    dateTo: ''
  })

  // --- Computed ---
  const totalPages = computed(() =>
    Math.max(1, pagination.totalPages || Math.ceil((pagination.total || 0) / (pagination.limit || 20)))
  )

  const pageButtons = computed(() => {
    const total = totalPages.value
    const current = pagination.page
    if (!total || total < 1) return []
    if (total <= 5) return Array.from({ length: total }, (_, i) => i + 1)
    const set = new Set([1, total, current])
    if (current - 1 > 1) set.add(current - 1)
    if (current + 1 < total) set.add(current + 1)
    const pages = Array.from(set).sort((a, b) => a - b)
    const out = []
    for (let i = 0; i < pages.length; i++) {
      if (i > 0 && pages[i] - pages[i - 1] > 1) out.push('…')
      out.push(pages[i])
    }
    return out
  })

  // --- Methods: Fetch Reports ---
  async function fetchReports(page = 1) {
    isLoading.value = true
    loadError.value = ''
    try {
      const res = await $api('/reports/admin', {
        query: {
          page,
          limit: pagination.limit,
          q: filters.q || undefined,
          type: filters.type || undefined,
          status: filters.status || undefined,
          dateFrom: filters.dateFrom || undefined,
          dateTo: filters.dateTo || undefined
        }
      })

      const list = res?.data || res?.items || []
      const p = res?.pagination || {}
      reports.value = list
      pagination.page = Number(p.page ?? page)
      pagination.limit = Number(p.limit ?? pagination.limit)
      pagination.total = Number(p.total ?? list.length)
      pagination.totalPages = Number(p.totalPages ?? Math.ceil(pagination.total / pagination.limit))
    } catch (err) {
      console.error('fetchReports failed:', err)
      loadError.value = err?.data?.message || 'ไม่สามารถโหลดข้อมูลได้'
      reports.value = []
    } finally {
      isLoading.value = false
    }
  }

  function changePage(next) {
    if (next < 1 || next > totalPages.value) return
    fetchReports(next)
  }

  function applyFilters() {
    pagination.page = 1
    fetchReports(1)
  }

  function clearFilters() {
    filters.q = ''
    filters.type = ''
    filters.status = ''
    filters.dateFrom = ''
    filters.dateTo = ''
    pagination.page = 1
    fetchReports(1)
  }

  // --- Methods: Get Single Report ---
  async function getReportById(id) {
    try {
      return await $api(`/reports/admin/${id}`)
    } catch (err) {
      console.error('getReportById failed:', err)
      throw err
    }
  }

  // --- Methods: Update Report Status ---
  async function updateReportStatus(id, status, adminNotes = '') {
    try {
      const updatedReport = await $api(`/reports/admin/${id}`, {
        method: 'PATCH',
        body: { status, adminNotes }
      })
      // Refresh the list
      await fetchReports(pagination.page)
      return updatedReport
    } catch (err) {
      console.error('updateReportStatus failed:', err)
      throw err
    }
  }

  // --- Methods: Delete Report ---
  async function deleteReport(id) {
    try {
      await $api(`/reports/admin/${id}`, {
        method: 'DELETE'
      })
      // Refresh the list
      await fetchReports(Math.min(pagination.page, totalPages.value))
    } catch (err) {
      console.error('deleteReport failed:', err)
      throw err
    }
  }

  // --- Methods: Create Report ---
  async function createReport(reportData) {
    try {
      const newReport = await $api('/reports', {
        method: 'POST',
        body: reportData
      })
      return newReport
    } catch (err) {
      console.error('createReport failed:', err)
      throw err
    }
  }

  // --- Helper: Type Badge Color ---
  function typeBadge(type) {
    const badges = {
      'DRIVER': 'bg-red-100 text-red-700',
      'PASSENGER': 'bg-blue-100 text-blue-700'
    }
    return badges[type] || 'bg-gray-100 text-gray-700'
  }

  // --- Helper: Type Label ---
  function typeLabel(type) {
    const labels = {
      'DRIVER': 'Driver',
      'PASSENGER': 'Passenger'
    }
    return labels[type] || type
  }

  // --- Helper: Status Badge Color ---
  function statusBadge(status) {
    const badges = {
      'PENDING': 'bg-yellow-100 text-yellow-700',
      'APPROVED': 'bg-green-100 text-green-700',
      'REJECTED': 'bg-red-100 text-red-700',
      'RESOLVED': 'bg-blue-100 text-blue-700'
    }
    return badges[status] || 'bg-gray-100 text-gray-700'
  }

  // --- Helper: Status Label ---
  function statusLabel(status) {
    const labels = {
      'PENDING': 'รอพิจารณา',
      'APPROVED': 'อนุมัติ',
      'REJECTED': 'ปฏิเสธ',
      'RESOLVED': 'แก้ไขแล้ว'
    }
    return labels[status] || status
  }

  return {
    // State
    reports,
    isLoading,
    loadError,
    pagination,
    filters,

    // Computed
    totalPages,
    pageButtons,

    // Methods
    fetchReports,
    changePage,
    applyFilters,
    clearFilters,
    getReportById,
    updateReportStatus,
    deleteReport,
    createReport,

    // Helpers
    typeBadge,
    typeLabel,
    statusBadge,
    statusLabel
  }
}
