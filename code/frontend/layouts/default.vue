<template>
    <div>
        <header class="sticky top-0 z-50 bg-white shadow-sm">
            <div class="px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
                <div class="flex items-center justify-between h-16">
                    <NuxtLink to="/">
                        <div class="flex items-center">
                            <h1 class="text-xl font-bold text-blue-600 sm:text-2xl">ไปนำแหน่</h1>
                        </div>
                    </NuxtLink>

                    <nav class="items-center hidden space-x-6 md:flex lg:space-x-8">
                        <NuxtLink to="/findTrip"
                            class="font-medium text-gray-600 transition-colors duration-200 hover:text-blue-700"
                            :class="{ 'text-blue-600': $route.path === '/findTrip' }">
                            ค้นหาเส้นทาง
                        </NuxtLink>

                        <div
                            v-if="user && (user.role === 'DRIVER')">
                            <NuxtLink to="/createTrip"
                                class="text-gray-600 transition-colors duration-200 hover:text-blue-600"
                                :class="{ 'text-blue-600': $route.path === '/createTrip' }">
                                สร้างเส้นทาง
                            </NuxtLink>
                        </div>

                        <!-- ผู้โดยสาร: ลิงก์เดี่ยว ไม่มีดรอปดาวน์ -->
                        <div v-if="user && user.role === 'PASSENGER'">
                            <NuxtLink to="/current-trip"
                                class="flex items-center px-4 py-2 text-sm font-medium transition-colors duration-200 rounded-md hover:text-blue-600"
                                :class="{ 'text-blue-600 border-b-2 border-blue-600': $route.path === '/current-trip', 'text-gray-600': $route.path !== '/current-trip' }">
                                <span v-if="hasActiveTrip" class="relative flex h-2 w-2 mr-1.5">
                                    <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                                    <span class="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                                </span>
                                กำลังเดินทาง...
                            </NuxtLink>
                        </div>
                        <div v-if="user && user.role === 'PASSENGER'">
                            <NuxtLink to="/myTrip"
                                class="flex items-center text-gray-600 transition-colors duration-200 hover:text-blue-600"
                                :class="{ 'text-blue-600': $route.path.startsWith('/myTrip') }">
                                การเดินทางของฉัน
                            </NuxtLink>
                        </div>

                        <!-- คนขับ: แสดงคำว่า การเดินทางทั้งหมด + ดรอปดาวน์ (การเดินทางของฉัน / คำขอจองเส้นทางของฉัน) -->
                        <div v-if="user && (user.role === 'DRIVER' || user.role === 'ADMIN')">
                            <div class="relative dropdown-trigger">
                                <NuxtLink to="/myTrip"
                                    class="flex items-center text-gray-600 transition-colors duration-200 hover:text-blue-600"
                                    :class="{ 'text-blue-600': $route.path.startsWith('/myTrip') || $route.path.startsWith('/myRoute') }">
                                    การเดินทางทั้งหมด
                                    <svg class="w-4 h-4 ml-1 transition-transform duration-200" fill="none"
                                        stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                            d="M19 9l-7 7-7-7"></path>
                                    </svg>
                                </NuxtLink>

                                <div
                                    class="absolute right-0 py-2 mt-5 bg-white border border-gray-200 rounded-lg shadow-lg dropdown-menu top-full w-50 user-dropdown-arrow">
                                    <NuxtLink to="/myTrip"
                                        class="flex items-center block w-full px-4 py-2 text-left text-gray-700 transition-colors duration-200 hover:bg-blue-50 hover:text-blue-600">
                                        การเดินทางของฉัน
                                    </NuxtLink>
                                    <NuxtLink v-if="hasActiveTrip" to="/current-trip"
                                        class="flex items-center block w-full px-4 py-2 text-left text-blue-600 font-bold transition-colors duration-200 hover:bg-blue-50">
                                        การเดินทางปัจจุบัน (Active)
                                    </NuxtLink>
                                    <NuxtLink to="/myRoute"
                                        class="flex items-center block w-full px-4 py-2 text-left text-gray-700 transition-colors duration-200 hover:bg-blue-50 hover:text-blue-600">
                                        คำขอจองเส้นทางของฉัน
                                    </NuxtLink>
                                </div>
                            </div>
                        </div>

                        <div v-if="!token" class="flex items-center space-x-3 ">
                            <NuxtLink to="/register"
                                class="text-gray-600 transition-colors duration-200 hover:text-blue-600">สมัครสมาชิก
                            </NuxtLink>
                            <span class="text-gray-600">|</span>
                            <NuxtLink to="/login"
                                class="text-gray-600 transition-colors duration-200 hover:text-blue-600">เข้าสู่ระบบ
                            </NuxtLink>
                        </div>

                        <!-- Bell (ผู้ใช้ทั่วไป + แอดมินใช้ตัวนี้บนเว็บหลัก) -->
                        <div v-if="token" class="relative">
                            <button ref="bellBtn" class="relative text-gray-600 hover:text-blue-600"
                                @click="onBellClick" aria-haspopup="true" :aria-expanded="openNotif ? 'true' : 'false'">
                                <svg :class="['w-5 h-5', { 'bell-shake': bellShake }]" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                        d="M15 17h5l-1.405-1.405C18.21 14.79 18 13.918 18 13V9a6 6 0 10-12 0v4c0 .918-.21 1.79-.595 2.595L4 17h5m6 0a3 3 0 11-6 0h6z" />
                                </svg>
                                <span v-if="unreadCount > 0 || tripUnread"
                                    class="absolute w-2 h-2 bg-red-500 rounded-full -top-1 -right-1"></span>
                            </button>

                            <transition enter-active-class="transition duration-150 ease-out"
                                enter-from-class="translate-y-1 opacity-0" enter-to-class="translate-y-0 opacity-100"
                                leave-active-class="transition duration-100 ease-in"
                                leave-from-class="translate-y-0 opacity-100" leave-to-class="translate-y-1 opacity-0">
                                <div v-if="openNotif" ref="notifPanel" class="absolute top-full right-0 mt-3 w-[360px] max-w-[90vw] max-h-[70vh]
                bg-white border border-gray-200 rounded-2xl shadow-xl overflow-hidden z-[60] origin-top" @click.stop>
                                    <!-- Header -->
                                    <div class="flex items-center justify-between px-4 py-3 border-b border-gray-200">
                                        <h3 class="text-lg font-semibold text-gray-800">Notification</h3>
                                        <button class="p-1 text-gray-500 hover:text-gray-700"
                                            @click="openNotif = false">
                                            <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                                    d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                        </button>
                                    </div>

                                    <!-- List -->
                                    <div class="max-h-[56vh] overflow-y-auto">
                                        <div v-if="notifications.length === 0 && !loading"
                                            class="px-4 py-8 text-sm text-center text-gray-500">ไม่มีการแจ้งเตือน</div>
                                        <div v-if="loading" class="px-4 py-4 text-sm text-gray-500">กำลังโหลด…</div>

                                        <div v-for="(n, idx) in notifications" :key="n.id || idx" class="relative">
                                            <div class="px-4 py-3 hover:bg-gray-50">
                                                <div class="flex items-start gap-3">
                                                    <!-- จุดสถานะ: อ่านแล้วย้อมเทา -->
                                                    <span class="inline-block w-2 h-2 mt-1 rounded-full"
                                                        :class="n.readAt ? 'bg-gray-300' : 'bg-emerald-500'"></span>

                                                    <div class="flex-1 min-w-0" :class="n.isTripRelated ? 'cursor-pointer' : ''" @click="handleNotifClick(n)">
                                                        <p class="text-sm font-medium text-gray-900 truncate">{{ n.title }}</p>
                                                        <p class="text-sm text-gray-600 line-clamp-2" :class="n.isTripRelated ? 'text-blue-600 font-semibold' : ''">{{ n.body }}</p>
                                                        <p class="mt-1 text-xs text-gray-400">{{ timeAgo(n.createdAt) }}</p>
                                                    </div>

                                                    <!-- เมนูสามจุด -->
                                                    <div class="relative shrink-0">
                                                        <button
                                                            class="p-1.5 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100"
                                                            @click.stop="toggleItemMenu(n.id)" aria-haspopup="true"
                                                            :aria-expanded="openMenuId === n.id ? 'true' : 'false'">
                                                            <svg class="w-4 h-4" viewBox="0 0 24 24"
                                                                fill="currentColor">
                                                                <circle cx="12" cy="5" r="2" />
                                                                <circle cx="12" cy="12" r="2" />
                                                                <circle cx="12" cy="19" r="2" />
                                                            </svg>
                                                        </button>

                                                        <div v-if="openMenuId === n.id"
                                                            class="absolute right-0 top-8 w-48 bg-white border border-gray-200 rounded-md shadow-lg z-[70]"
                                                            @click.stop>
                                                            <button
                                                                class="flex items-center w-full gap-2 px-3 py-2 text-sm hover:bg-gray-50"
                                                                @click="markAsRead(n)">
                                                                <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none"
                                                                    stroke="currentColor">
                                                                    <circle cx="12" cy="12" r="9" stroke-width="2" />
                                                                    <path d="M9 12l2 2 4-4" stroke-width="2"
                                                                        stroke-linecap="round"
                                                                        stroke-linejoin="round" />
                                                                </svg>
                                                                ทำเครื่องหมายอ่านแล้ว
                                                            </button>
                                                            <button
                                                                class="flex items-center w-full gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                                                                @click="removeNotification(n)">
                                                                <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none"
                                                                    stroke="currentColor">
                                                                    <path stroke-width="2" stroke-linecap="round"
                                                                        stroke-linejoin="round"
                                                                        d="M19 7l-1 12a2 2 0 01-2 2H8a2 2 0 01-2-2L5 7m3-3h8m-9 3h10M9 7V4a1 1 0 011-1h4a1 1 0 011 1v3" />
                                                                </svg>
                                                                ลบการแจ้งเตือนนี้
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            <div class="mx-4 border-t border-gray-200"
                                                v-if="idx !== notifications.length - 1"></div>
                                        </div>
                                    </div>

                                    <!-- Footer -->
                                    <div class="px-4 py-3 bg-white border-t border-gray-200">
                                        <NuxtLink to="/notifications"
                                            class="block w-full px-4 py-2 text-sm font-medium text-center text-blue-700 rounded-lg bg-blue-50 hover:bg-blue-100"
                                            @click="openNotif = false">
                                            View All Notification
                                        </NuxtLink>
                                    </div>
                                </div>
                            </transition>
                        </div>

                        <!-- โปรไฟล์ passenger , driver -->
                        <div v-if="user && (user.role === 'PASSENGER' || user.role === 'DRIVER')"
                            class="relative dropdown-trigger">
                            <div
                                class="flex items-center px-3 py-2 pl-4 space-x-2 transition-colors duration-200 border-l border-gray-200 rounded-lg cursor-pointer hover:bg-blue-50">
                                <div class="flex items-center justify-center w-8 h-8 bg-blue-100 rounded-full">
                                    <svg class="w-5 h-5 text-blue-600" fill="none" stroke="currentColor"
                                        viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                    </svg>
                                </div>
                                <span class="font-medium text-blue-600">{{ user.firstName }}</span>
                                <svg class="w-4 h-4 text-blue-600 transition-transform duration-200" fill="none"
                                    stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                        d="M19 9l-7 7-7-7"></path>
                                </svg>
                            </div>
                            <div
                                class="absolute right-0 w-40 py-2 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg dropdown-menu top-full user-dropdown-arrow">
                                <NuxtLink to="/profile"
                                    class="flex items-center block w-full px-4 py-2 text-left text-gray-700 transition-colors duration-200 hover:bg-blue-50 hover:text-blue-600">
                                    บัญชีของฉัน
                                </NuxtLink>
                                <button @click="logout"
                                    class="flex items-center block w-full px-4 py-2 text-left text-red-600 transition-colors duration-200 hover:bg-red-50 hover:text-red-700">
                                    ออกจากระบบ
                                </button>
                            </div>
                        </div>

                        <!-- โปรไฟล์ admin -->
                        <div v-if="user && user.role === 'ADMIN'" class="relative dropdown-trigger">
                            <div
                                class="flex items-center px-3 py-2 pl-4 space-x-2 transition-colors duration-200 border-l border-gray-200 rounded-lg cursor-pointer hover:bg-blue-50">
                                <div class="flex items-center justify-center w-8 h-8 bg-blue-100 rounded-full">
                                    <svg class="w-5 h-5 text-blue-600" fill="none" stroke="currentColor"
                                        viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                    </svg>
                                </div>
                                <span class="font-medium text-blue-600">{{ user.firstName }}</span>
                                <svg class="w-4 h-4 text-blue-600 transition-transform duration-200" fill="none"
                                    stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                        d="M19 9l-7 7-7-7"></path>
                                </svg>
                            </div>
                            <div
                                class="absolute right-0 w-40 py-2 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg dropdown-menu top-full user-dropdown-arrow">
                                <NuxtLink to="/profile"
                                    class="flex items-center block w-full px-4 py-2 text-left text-gray-700 transition-colors duration-200 hover:bg-blue-50 hover:text-blue-600">
                                    บัญชีของฉัน
                                </NuxtLink>
                                <NuxtLink to="/admin/users"
                                    class="flex items-center block w-full px-4 py-2 text-left text-gray-700 transition-colors duration-200 hover:bg-blue-50 hover:text-blue-600">
                                    Dashboard
                                </NuxtLink>
                                <button @click="logout"
                                    class="flex items-center block w-full px-4 py-2 text-left text-red-600 transition-colors duration-200 hover:bg-red-50 hover:text-red-700">
                                    Logout
                                </button>
                            </div>
                        </div>


                    </nav>

                    <div class="md:hidden">
                        <button @click="toggleMobileMenu" type="button"
                            class="text-gray-600 transition-colors duration-200 hover:text-blue-600 focus:outline-none focus:text-blue-600">
                            <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path v-if="!isMobileMenuOpen" stroke-linecap="round" stroke-linejoin="round"
                                    stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
                                <path v-else stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                    d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>

                <!-- ==================== Mobile Menu ==================== -->
                <div v-show="isMobileMenuOpen" class="border-t border-gray-200 md:hidden">
                    <div class="px-2 pt-2 pb-3 space-y-1 bg-white">
                        <NuxtLink to="/findTrip"
                            class="block px-3 py-2 font-medium transition-colors duration-200 rounded-md"
                            :class="$route.path === '/findTrip' ? 'text-blue-600 bg-blue-50' : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50'"
                            @click="closeMobileMenu">
                            ค้นหาเส้นทาง
                        </NuxtLink>

                        <NuxtLink
                            v-if="user && (user.role === 'PASSENGER' || user.role === 'DRIVER' || user.role === 'ADMIN')"
                            to="/createTrip" class="block px-3 py-2 transition-colors duration-200 rounded-md"
                            :class="$route.path === '/createTrip' ? 'text-blue-600 bg-blue-50' : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50'"
                            @click="closeMobileMenu">
                            สร้างเส้นทาง
                        </NuxtLink>

                        <!-- ผู้โดยสาร: ลิงก์เดี่ยว -->
                        <NuxtLink v-if="user && user.role === 'PASSENGER' && hasActiveTrip" to="/current-trip"
                            class="block px-3 py-2 font-bold transition-colors duration-200 rounded-md"
                            :class="$route.path === '/current-trip' ? 'text-blue-600 bg-blue-50' : 'text-blue-600 hover:bg-blue-50'"
                            @click="closeMobileMenu">
                            กำลังเดินทาง... (Active)
                        </NuxtLink>
                        <NuxtLink v-if="user && user.role === 'PASSENGER'" to="/myTrip"
                            class="block px-3 py-2 transition-colors duration-200 rounded-md"
                            :class="$route.path.startsWith('/myTrip') ? 'text-blue-600 bg-blue-50' : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50'"
                            @click="closeMobileMenu">
                            การเดินทางของฉัน
                        </NuxtLink>

                        <!-- คนขับ: เมนูย่อย 2 รายการ -->
                        <div v-else-if="user && (user.role === 'DRIVER' || user.role === 'ADMIN')" class="relative">
                            <button @click="toggleMobileTripMenu"
                                class="flex items-center justify-between w-full px-3 py-2 text-left text-gray-600 transition-colors duration-200 rounded-md hover:text-blue-600 hover:bg-blue-50">
                                การเดินทางทั้งหมด
                                <svg class="w-4 h-4 transition-transform duration-200"
                                    :class="{ 'rotate-180': isMobileTripMenuOpen }" fill="none" stroke="currentColor"
                                    viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                        d="M19 9l-7 7-7-7"></path>
                                </svg>
                            </button>
                            <div v-show="isMobileTripMenuOpen" class="mt-1 ml-4">
                                <NuxtLink to="/myTrip"
                                    class="block px-3 py-2 text-gray-500 transition-colors duration-200 rounded-md hover:text-blue-600 hover:bg-blue-50"
                                    @click="closeMobileMenu">
                                    การเดินทางของฉัน
                                </NuxtLink>
                                <NuxtLink v-if="hasActiveTrip" to="/current-trip"
                                    class="block px-3 py-2 text-sm font-bold transition-colors duration-200 rounded-md"
                                    :class="$route.path === '/current-trip' ? 'text-blue-600 bg-blue-50' : 'text-gray-700 hover:text-blue-600 hover:bg-blue-50'"
                                    @click="closeMobileMenu">
                                    จัดการทริปปัจจุบัน (Active)
                                </NuxtLink>
                                <NuxtLink to="/myRoute"
                                    class="block px-3 py-2 text-gray-500 transition-colors duration-200 rounded-md hover:text-blue-600 hover:bg-blue-50"
                                    @click="closeMobileMenu">
                                    คำขอจองเส้นทางของฉัน
                                </NuxtLink>
                            </div>
                        </div>

                        <div v-if="!token">
                            <NuxtLink to="/register" class="block px-3 py-2 transition-colors duration-200 rounded-md"
                                :class="$route.path === '/register' ? 'text-blue-600 bg-blue-50' : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50'"
                                @click="closeMobileMenu">
                                สมัครสมาชิก
                            </NuxtLink>
                            <NuxtLink to="/login" class="block px-3 py-2 transition-colors duration-200 rounded-md"
                                :class="$route.path === '/login' ? 'text-blue-600 bg-blue-50' : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50'"
                                @click="closeMobileMenu">
                                เข้าสู่ระบบ
                            </NuxtLink>
                        </div>

                        <div v-else-if="user && (user.role === 'PASSENGER' || user.role === 'DRIVER')"
                            class="pt-2 mt-2 border-t border-gray-200">
                            <div class="flex items-center px-3 py-2">
                                <div class="flex items-center justify-center w-8 h-8 bg-blue-100 rounded-full">
                                    <svg class="w-5 h-5 text-blue-600" fill="none" stroke="currentColor"
                                        viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                    </svg>
                                </div>
                                <span class="ml-2 font-medium text-gray-700">{{ user.firstName }}</span>
                            </div>
                            <div class="mt-1 ml-6">
                                <NuxtLink to="/profile" @click="closeMobileMenu"
                                    class="flex items-center block w-full px-3 py-2 text-left text-gray-600 transition-colors duration-200 rounded-md hover:bg-blue-50 hover:text-blue-600">
                                    บัญชีของฉัน
                                </NuxtLink>
                                <button @click="logout"
                                    class="flex items-center block w-full px-3 py-2 text-left text-red-600 transition-colors duration-200 rounded-md hover:bg-red-50 hover:text-red-700">
                                    Logout
                                </button>
                            </div>
                        </div>
                        <div v-else-if="user && user.role === 'ADMIN'" class="pt-2 mt-2 border-t border-gray-200">
                            <div class="flex items-center px-3 py-2">
                                <div class="flex items-center justify-center w-8 h-8 bg-blue-100 rounded-full">
                                    <svg class="w-5 h-5 text-blue-600" fill="none" stroke="currentColor"
                                        viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                    </svg>
                                </div>
                                <span class="ml-2 font-medium text-gray-700">{{ user.firstName }}</span>
                            </div>
                            <div class="mt-1 ml-6">
                                <NuxtLink to="/profile" @click="closeMobileMenu"
                                    class="flex items-center block w-full px-3 py-2 text-left text-gray-600 transition-colors duration-200 rounded-md hover:bg-blue-50 hover:text-blue-600">
                                    บัญชีของฉัน
                                </NuxtLink>
                                <NuxtLink to="/admin/users" @click="closeMobileMenu"
                                    class="flex items-center block w-full px-3 py-2 text-left text-gray-600 transition-colors duration-200 rounded-md hover:bg-blue-50 hover:text-blue-600">
                                    Dashboard
                                </NuxtLink>
                                <button @click="logout"
                                    class="flex items-center block w-full px-3 py-2 text-left text-red-600 transition-colors duration-200 rounded-md hover:bg-red-50 hover:text-red-700">
                                    Logout
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
                <!-- ==================== End Mobile Menu ==================== -->
            </div>
        </header>

        <main class="flex-1">
            <NuxtPage />
        </main>
    </div>

    <!-- ========== Global Driver Arrival Modal (High Awareness) ========== -->
    <Teleport to="body">
        <Transition
            enter-active-class="transition ease-out duration-300"
            enter-from-class="opacity-0"
            enter-to-class="opacity-100"
            leave-active-class="transition ease-in duration-200"
            leave-from-class="opacity-100"
            leave-to-class="opacity-0"
        >
            <div v-if="showPassengerArrivalModal" class="fixed inset-0 z-[9999] flex items-center justify-center p-4">
                <!-- Backdrop -->
                <div class="absolute inset-0 bg-gray-900/40 backdrop-blur-md" @click="closePassengerArrivalModal"></div>
                
                <!-- Modal Card -->
                <Transition
                    enter-active-class="transition ease-out duration-500"
                    enter-from-class="opacity-0 scale-95 translate-y-4"
                    enter-to-class="opacity-100 scale-100 translate-y-0"
                >
<<<<<<< HEAD
                    <div class="relative w-full max-w-sm bg-white rounded-3xl shadow-2xl overflow-hidden">
                        <!-- Close button -->
                        <button @click="showArrivalModal = false"
                            class="absolute top-4 right-4 z-10 w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 transition">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M6 18L18 6M6 6l12 12"/>
                            </svg>
                        </button>

                        <!-- Header gradient -->
                        <div :class="arrivalData?.reason ? 'bg-gradient-to-br from-orange-400 to-orange-600' : 'bg-gradient-to-br from-blue-500 to-blue-700'" 
                            class="px-8 pt-10 pb-14 text-center transition-colors duration-500">
                            <!-- Icon -->
                            <div class="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 ring-4 ring-white/30 backdrop-blur-md transition-all duration-300">
                                <svg class="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path v-if="!arrivalData?.reason" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M15 17h5l-1.405-1.405C18.21 14.79 18 13.918 18 13V9a6 6 0 10-12 0v4c0 .918-.21 1.79-.595 2.595L4 17h5m6 0a3 3 0 11-6 0h6z"/>
                                  <path v-else stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
                                </svg>
                            </div>
                            <h2 class="text-2xl font-black text-white mb-1">
                                {{ arrivalData?.reason ? 'เหตุขัดข้อง/ล่าช้า' : 'คนขับกำลังมาถึง!' }}
                            </h2>
                            <p class="text-white/80 text-sm font-medium">คุณ {{ arrivalData?.driverName || 'คนขับ' }} กำลังมุ่งหน้ามาหาคุณ</p>
                        </div>

                        <!-- Content (overlap card style) -->
                        <div class="-mt-8 mx-4 bg-white rounded-2xl shadow-lg px-6 py-5 mb-4 text-center">
                            <p class="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1">เวลาโดยประมาณ</p>
                            <p class="text-5xl font-black leading-none" :class="arrivalData?.reason ? 'text-orange-600' : 'text-blue-600'">
                                {{ arrivalData?.minutes }}<span class="text-xl text-gray-400 font-normal ml-1">นาที</span>
                            </p>
                        </div>

                        <!-- Special Reason Box -->
                        <div v-if="arrivalData?.reason" class="mx-6 mb-4 p-4 bg-orange-50 border border-orange-100 rounded-2xl text-left animate-in slide-in-from-bottom-2 duration-500">
                            <div class="flex items-center gap-2 mb-1">
                                <svg class="w-4 h-4 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
                                <span class="text-[10px] font-bold text-orange-600 uppercase">อัปเดตสถานะ/เหตุขัดข้อง</span>
                            </div>
                            <p class="text-sm font-bold text-orange-800">{{ arrivalData?.reason }}</p>
                        </div>

                        <!-- Footer action -->
                        <div class="px-6 pb-6 text-center">
                            <p v-if="!arrivalData?.reason" class="text-xs text-gray-400 mb-4 font-medium">กรุณาเตรียมตัวให้พร้อม ณ จุดนัดพบของคุณ</p>
                            <button @click="showArrivalModal = false"
                                class="w-full py-4 text-white font-black rounded-2xl shadow-xl transition-all active:scale-95"
                                :class="arrivalData?.reason ? 'bg-orange-500 hover:bg-orange-600 shadow-orange-100' : 'bg-blue-600 hover:bg-blue-700 shadow-blue-100'">
=======
                    <div class="relative w-full max-w-sm bg-white rounded-[2.5rem] shadow-2xl overflow-hidden">
                        <!-- Status Badge -->
                        <div class="absolute top-6 left-1/2 -translate-x-1/2 z-10">
                            <div :class="passengerArrivalData.isUpdate ? 'bg-amber-500' : 'bg-blue-600'" 
                                 class="px-4 py-1.5 rounded-full shadow-lg">
                                <span class="text-[10px] font-black text-white uppercase tracking-widest">
                                    {{ passengerArrivalData.isUpdate ? 'เเจ้งเปลี่ยนเวลา' : 'คนขับใกล้ถึงเเล้ว' }}
                                </span>
                            </div>
                        </div>

                        <!-- Animated Background/Icon Area -->
                        <div :class="passengerArrivalData.isUpdate ? 'bg-amber-50' : 'bg-blue-50'" 
                             class="relative h-48 flex items-center justify-center overflow-hidden">
                            <!-- Decorative Circles -->
                            <div class="absolute inset-0 flex items-center justify-center opacity-20">
                                <div class="w-64 h-64 border-2 border-current rounded-full animate-ping duration-[3000ms]" :class="passengerArrivalData.isUpdate ? 'text-amber-300' : 'text-blue-300'"></div>
                                <div class="absolute w-48 h-48 border-2 border-current rounded-full animate-ping duration-[4000ms]" :class="passengerArrivalData.isUpdate ? 'text-amber-200' : 'text-blue-200'"></div>
                            </div>

                            <!-- Main Visual -->
                            <div :class="passengerArrivalData.isUpdate ? 'bg-amber-500' : 'bg-blue-600'" 
                                 class="w-24 h-24 rounded-[2rem] flex items-center justify-center shadow-xl rotate-3">
                                 <i :class="passengerArrivalData.minutes === 0 ? 'fa-solid fa-location-dot' : (passengerArrivalData.isUpdate ? 'fa-solid fa-rotate-right' : 'fa-solid fa-car-side')" 
                                    class="text-4xl text-white"></i>
                            </div>
                        </div>

                        <div class="p-8 text-center bg-white">
                            <h2 class="text-2xl font-black text-gray-900 leading-tight mb-2">
                                {{ passengerArrivalData.minutes === 0 ? 'คนขับถึงเเล้ว!' : `อีกประมาณ ${passengerArrivalData.minutes} นาที` }}
                            </h2>
                            <p class="text-sm font-medium text-gray-500 mb-6">
                                คุณ<strong>{{ passengerArrivalData.driverName }}</strong> {{ passengerArrivalData.minutes === 0 ? 'จอดรออยู่ที่จุดรับของคุณเเล้ว' : 'กำลังรอนำพาคุณเดินทาง' }}
                            </p>

                            <!-- Reason Block if Update -->
                            <div v-if="passengerArrivalData.reason" class="mb-8 p-4 bg-gray-50 rounded-2xl border border-gray-100 flex items-start gap-3">
                                <div class="w-8 h-8 rounded-full bg-white shadow-sm flex items-center justify-center flex-shrink-0">
                                    <i class="fa-solid fa-comment-dots text-gray-400 text-xs"></i>
                                </div>
                                <p class="text-[11px] text-gray-600 leading-normal text-left italic font-medium">"{{ passengerArrivalData.reason }}"</p>
                            </div>

                            <button @click="closePassengerArrivalModal" 
                                class="w-full py-4 text-white font-black rounded-[1.25rem] transition-all active:scale-95 shadow-xl"
                                :class="passengerArrivalData.isUpdate ? 'bg-amber-500 hover:bg-amber-600 shadow-amber-200' : 'bg-blue-600 hover:bg-blue-700 shadow-blue-200'">
>>>>>>> main
                                รับทราบ
                            </button>
                        </div>
                    </div>
                </Transition>
            </div>
        </Transition>
    </Teleport>

</template>


<script setup>
import { ref, onMounted, onUnmounted, computed, watch } from 'vue'
import { useRuntimeConfig, useCookie, useRoute } from '#app'
import { useAuth } from '~/composables/useAuth'
import { useSocket } from '~/composables/useSocket'
import { useRouter } from 'vue-router'
import { useNotifications } from '~/composables/useNotifications'

const route = useRoute()
const { token, user, logout } = useAuth()
const router = useRouter()
const { resetChat, hasUnread: tripUnread } = useNotifications()

/* ====== เมนูบนสุดเดิม ====== */
const isMobileMenuOpen = ref(false)
const isMobileTripMenuOpen = ref(false)

const toggleMobileMenu = () => {
    isMobileMenuOpen.value = !isMobileMenuOpen.value
    if (!isMobileMenuOpen.value) {
        isMobileTripMenuOpen.value = false
    }
}
const closeMobileMenu = () => {
    isMobileMenuOpen.value = false
    isMobileTripMenuOpen.value = false
}
const toggleMobileTripMenu = () => {
    isMobileTripMenuOpen.value = !isMobileTripMenuOpen.value
}
const handleResize = () => {
    if (window.innerWidth >= 768) {
        isMobileMenuOpen.value = false
        isMobileTripMenuOpen.value = false
    }
}

/* ====== Bell Notification (ผู้ใช้ทั่วไป) ====== */
const openNotif = ref(false)
const openMenuId = ref(null)   // เมนูสามจุดของแต่ละรายการ
const loading = ref(false)
const bellBtn = ref(null)
const notifPanel = ref(null)
const notifications = ref([])  // [{ id, title, body, createdAt, readAt }]

const unreadCount = computed(() => notifications.value.filter(n => !n.readAt).length)

function toggleNotif() {
    openNotif.value = !openNotif.value
    if (!openNotif.value) openMenuId.value = null
}

async function onBellClick() {
    toggleNotif()
    if (openNotif.value && notifications.value.length === 0) {
        await fetchUserNotifications()
    }
}

/** GET /notifications (ผู้ใช้ทั่วไป: แสดงทั้งหมด ไม่กรอง initiatedBy) */
async function fetchUserNotifications() {
    try {
        if (!token.value) return
        loading.value = true

        const apiBase = useRuntimeConfig().public.apiBase || 'http://localhost:3000/api'
        const tk = useCookie('token')?.value || (process.client ? localStorage.getItem('token') : '')

        const res = await $fetch('/notifications', {
            baseURL: apiBase,
            headers: { Accept: 'application/json', ...(tk ? { Authorization: `Bearer ${tk}` } : {}) },
            query: { page: 1, limit: 20 }
        })

        const raw = Array.isArray(res?.data) ? res.data : []
        notifications.value = raw.map(it => {
            const isTripRelated = it.type === 'BOOKING' || it.kind === 'ROUTE_COMPLETED' || it.kind === 'ARRIVAL_NOTIFICATION'
            let body = it.body || ''
            if (isTripRelated && !body.includes('(กดไปดู)')) {
                body += ' (กดไปดู)'
            }
            return {
                id: it.id,
                title: it.title || '-',
                body: body,
                createdAt: it.createdAt || Date.now(),
                readAt: it.readAt || null,
                isTripRelated
            }
        })
    } catch (e) {
        console.error(e)
        notifications.value = []
    } finally {
        loading.value = false
    }
}

/** เมนูย่อยของแต่ละรายการ */
function toggleItemMenu(id) {
    openMenuId.value = openMenuId.value === id ? null : id
}

/** PATCH /notifications/:id/read -> set readAt (ผู้ใช้ทั่วไป) */
async function markAsRead(n) {
    try {
        const apiBase = useRuntimeConfig().public.apiBase || 'http://localhost:3000/api'
        const tk = useCookie('token')?.value || (process.client ? localStorage.getItem('token') : '')
        await fetch(`${apiBase}/notifications/${n.id}/read`, {
            method: 'PATCH',
            headers: { Accept: 'application/json', ...(tk ? { Authorization: `Bearer ${tk}` } : {}) },
            credentials: 'include'
        })
        const i = notifications.value.findIndex(x => x.id === n.id)
        if (i > -1) notifications.value[i].readAt = new Date().toISOString()
    } finally {
        openMenuId.value = null
    }
}

async function handleNotifClick(n) {
    if (n.isTripRelated) {
        openNotif.value = false
        await navigateTo('/current-trip')
    }
    // Optional: mark as read when clicked
    if (!n.readAt) {
        await markAsRead(n)
    }
}

/** DELETE /notifications/:id */
async function removeNotification(n) {
    try {
        const apiBase = useRuntimeConfig().public.apiBase || 'http://localhost:3000/api'
        const tk = useCookie('token')?.value || (process.client ? localStorage.getItem('token') : '')
        await fetch(`${apiBase}/notifications/${n.id}`, {
            method: 'DELETE',
            headers: { Accept: 'application/json', ...(tk ? { Authorization: `Bearer ${tk}` } : {}) },
            credentials: 'include'
        })
        notifications.value = notifications.value.filter(x => x.id !== n.id)
    } finally {
        openMenuId.value = null
    }
}

/* ปิด dropdown เมื่อคลิกนอก/กด Esc */
function onClickOutside(e) {
    if (!openNotif.value) return
    const t = e.target
    if (notifPanel.value?.contains(t) || bellBtn.value?.contains(t)) return
    openNotif.value = false
    openMenuId.value = null
}
function onKey(e) {
    if (e.key === 'Escape') {
        openNotif.value = false
        openMenuId.value = null
    }
}

/* เวลาแบบย่อ */
function timeAgo(ts) {
    const ms = Date.now() - new Date(ts).getTime()
    const m = Math.floor(ms / 60000)
    if (m < 1) return 'just now'
    if (m < 60) return `${m} min ago`
    const h = Math.floor(m / 60)
    if (h < 24) return `${h} hr ago`
    const d = Math.floor(h / 24)
    return `${d} d ago`
}

/* lifecycle */
onMounted(() => {
    window.addEventListener('resize', handleResize)
    document.addEventListener('click', onClickOutside)
    document.addEventListener('keydown', onKey)
    if (token.value) {
        fetchUserNotifications()
        checkActiveTrip()
    }
})

// Watch route to re-check status if navigating to trip pages
watch(() => route.path, (newPath) => {
    if (token.value) checkActiveTrip()
})

const hasActiveTrip = ref(false)
async function checkActiveTrip() {
    if (!token.value) {
        hasActiveTrip.value = false
        return
    }
    try {
        const apiBase = useRuntimeConfig().public.apiBase || 'http://localhost:3000/api'
        const tk = useCookie('token')?.value || (process.client ? localStorage.getItem('token') : '')
        if (!tk) {
            hasActiveTrip.value = false
            return
        }
        
        const res = await $fetch('/routes/active', {
            baseURL: apiBase,
            headers: { Accept: 'application/json', Authorization: `Bearer ${tk}` },
            query: { _t: Date.now() } // Burst cache to ensure real status
        })
        // Ensure we check for data specifically if the response is a wrapper
        hasActiveTrip.value = !!(res?.data)
    } catch (e) {
        hasActiveTrip.value = false
    }
}

onUnmounted(() => {
    window.removeEventListener('resize', handleResize)
    document.removeEventListener('click', onClickOutside)
    document.removeEventListener('keydown', onKey)
})

// --- Socket.IO: real-time notification listener ---
const { onEvent } = useSocket()
const bellShake = ref(false)

onEvent('notification:new', (data) => {
  // Prepend the new notification to the list
  const isTripRelated = data.type === 'BOOKING' || data.kind === 'ROUTE_COMPLETED' || data.kind === 'ARRIVAL_NOTIFICATION'
  const displayText = isTripRelated ? `${data.body || data.message || ''} (กดไปดู)` : (data.body || data.message || '')

  const newNotif = {
    id: data.id || Date.now(),
    title: data.title || 'การแจ้งเตือนใหม่',
    body: displayText,
    createdAt: data.createdAt || new Date().toISOString(),
    readAt: null,
    isTripRelated
  }
  notifications.value.unshift(newNotif)

  // Trigger bell shake animation
  bellShake.value = true
  setTimeout(() => { bellShake.value = false }, 1000)
  
  // IMMEDIATELY refresh active trip status if trip related
  if (isTripRelated) {
      checkActiveTrip()
  }
})

// --- Nav Bar & Active Trip Sync ---
onEvent('booking:statusChanged', () => checkActiveTrip())
onEvent('trip:started', () => checkActiveTrip())
onEvent('booking:passengerStatusChanged', () => checkActiveTrip())
onEvent('booking:tripCompleted', () => {
    hasActiveTrip.value = false
    // we don't clear bell notifications here manually anymore; it will sync on next fetch
    checkActiveTrip()
})
onEvent('booking:cancelled', () => checkActiveTrip())
onEvent('trip:started', () => checkActiveTrip())

/* ====== Driver Arrival Notification (High Awareness) ====== */
const showPassengerArrivalModal = ref(false)
const passengerArrivalData = ref({ minutes: 5, driverName: '', reason: '', isUpdate: false })

function closePassengerArrivalModal() {
    showPassengerArrivalModal.value = false
}

onEvent('booking:driverArriving', (data) => {
<<<<<<< HEAD
    // If we're on the current-trip page, it has its own detailed modal, so skip this one
    if (route.path === '/current-trip') return
    
    arrivalData.value = data
    showArrivalModal.value = true
=======
    passengerArrivalData.value = {
        minutes: data.minutes,
        driverName: data.driverName,
        reason: data.reason || '',
        isUpdate: data.isUpdate || false
    }
    showPassengerArrivalModal.value = true
>>>>>>> main
})

/* ใส่ฟอนต์ Kanit แบบเดิม */
useHead({
    link: [
        { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=Kanit:wght@300;400;500;600;700&display=swap' },
        { rel: 'stylesheet', href: 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css' }
    ]
})
</script>


<style scoped>
* {
    font-family: 'Kanit', sans-serif;
}

.dropdown-menu {
    opacity: 0;
    visibility: hidden;
    transform: translateY(-10px);
    transition: all 0.3s ease;
}

.dropdown-trigger:hover .dropdown-menu {
    opacity: 1;
    visibility: visible;
    transform: translateY(0);
}

.dropdown-arrow::before {
    content: '';
    position: absolute;
    top: -6px;
    left: 50%;
    transform: translateX(-50%);
    width: 0;
    height: 0;
    border-left: 6px solid transparent;
    border-right: 6px solid transparent;
    border-bottom: 6px solid white;
}

.user-dropdown-arrow::before {
    left: 80%;
}

.rotate-180 {
    transform: rotate(180deg);
}

.line-clamp-2 {
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    line-clamp: 2;
    overflow: hidden;
}

@keyframes bell-shake {
    0%, 100% { transform: rotate(0); }
    10% { transform: rotate(14deg); }
    20% { transform: rotate(-14deg); }
    30% { transform: rotate(10deg); }
    40% { transform: rotate(-10deg); }
    50% { transform: rotate(6deg); }
    60% { transform: rotate(-6deg); }
    70% { transform: rotate(2deg); }
    80% { transform: rotate(-2deg); }
    90% { transform: rotate(0); }
}

.bell-shake {
    animation: bell-shake 0.8s ease-in-out;
}
</style>