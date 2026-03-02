import { useCookie } from '#app'

export default defineNuxtPlugin(() => {
  const config = useRuntimeConfig()

  const api = $fetch.create({
    baseURL: config.public.apiBase,
    credentials: 'include',

    async onRequest({ options }) {
      const token = useCookie('token').value
      if (token) {
        options.headers = {
          ...options.headers,
          Authorization: `Bearer ${token}`,
        }
      }
    },

    onResponse({ response }) {
      if (response._data && Object.prototype.hasOwnProperty.call(response._data, 'data')) {
        response._data = response._data.data
      }
    },
    // onResponse({ response }) {
    //   const b = response._data
    //   if (b && typeof b === 'object' && Object.prototype.hasOwnProperty.call(b, 'data')) {
    //     response._data = Object.prototype.hasOwnProperty.call(b, 'pagination')
    //       ? { data: b.data, pagination: b.pagination }   
    //       : b.data                                       
    //   }
    // },

    onResponseError({ response }) {
      const statusCode = response?.status

      // Handle 401 Unauthorized globally
      if (statusCode === 401) {
        const token = useCookie('token')
        const user = useCookie('user')

        // Only trigger if we actually had a token (to avoid loops on initial login failure)
        if (token.value) {
          token.value = null
          user.value = null

          const toast = useToast()
          const router = useRouter()

          // Show toast and redirect if not already on login page
          if (!window.location.pathname.includes('/login')) {
            toast.warning('Session หมดอายุ', 'กรุณาเข้าสู่ระบบใหม่อีกครั้ง')
            router.push('/login')
          }
        }
      }

      let body = response?._data
      if (typeof body === 'string') {
        try { body = JSON.parse(body) } catch { }
      }

      const msg =
        body?.message ||
        body?.error?.message ||
        body?.error ||
        response?.statusText ||
        'Request failed'

      throw createError({
        statusCode: statusCode || 500,
        statusMessage: msg,
        data: body,
      })
    },
  })

  return { provide: { api } }
})
