<template>
  <div class="min-h-screen bg-gray-50 text-gray-900 font-kanit">
    <!-- Header -->
    <header class="bg-white border-b border-gray-200 sticky top-0 z-30">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div class="flex items-center gap-3">
          <NuxtLink :to="role === 'DRIVER' ? '/myRoute' : '/myTrip'" class="p-2 hover:bg-gray-100 rounded-full transition">
            <svg class="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
            </svg>
          </NuxtLink>
          <h1 class="text-xl font-bold text-gray-900">การเดินทางปัจจุบัน</h1>
        </div>
        <div v-if="activeTrip && !isAdminPage" class="flex items-center gap-2">
            <span class="flex h-3 w-3 relative">
                <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                <span class="relative inline-flex rounded-full h-3 w-3 bg-blue-500"></span>
            </span>
            <span class="text-sm font-medium text-blue-600">{{ statusText }}</span>
        </div>
      </div>
    </header>

    <main v-if="isLoading" class="flex flex-col items-center justify-center h-[calc(100vh-64px)]">
        <div class="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p class="text-gray-500 animate-pulse">กำลังโหลดผลการเดินทาง...</p>
    </main>

    <main v-else-if="!activeTrip && !isTripCompleted" class="max-w-7xl mx-auto px-4 py-12 text-center">
        <div class="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 max-w-md mx-auto">
            <div class="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg class="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
            </div>
            <h2 class="text-2xl font-bold mb-2">ไม่พบการเดินทางที่กำลังดำเนินการ</h2>
            <p class="text-gray-600 mb-8">คุณไม่มีการเดินทางที่กำลังติตตามในขณะนี้</p>
            <NuxtLink to="/" class="inline-flex items-center justify-center px-6 py-3 text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition w-full shadow-lg shadow-blue-200">
                กลับหน้าหลัก
            </NuxtLink>
        </div>
    </main>

    <div v-else-if="activeTrip" class="max-w-7xl mx-auto flex flex-col lg:flex-row h-auto lg:h-[calc(100vh-128px)] overflow-hidden">
        <!-- Sidebar: Info & Actions -->
        <div class="w-full lg:w-96 overflow-y-auto border-r border-gray-200 bg-white" :class="{'hidden lg:block': showMapOnMobile}">
            <!-- Trip Summary Card -->
            <div class="p-6 space-y-6">
                <div class="bg-blue-50 p-4 rounded-xl border border-blue-100">
                    <div class="flex items-start gap-3">
                        <div class="mt-1">
                            <div class="w-3 h-3 rounded-full bg-blue-500 border-2 border-white ring-1 ring-blue-500 ring-offset-2"></div>
                            <div class="w-0.5 h-10 bg-blue-200 mx-auto my-1"></div>
                            <div class="w-3 h-3 rounded-full bg-green-500 border-2 border-white ring-1 ring-green-500 ring-offset-2"></div>
                        </div>
                        <div class="flex-1 space-y-4 min-w-0">
                            <div>
                                <p class="text-xs text-blue-600 font-bold uppercase tracking-wider mb-0.5">จุดรับ</p>
                                <p class="text-sm font-semibold truncate">{{ activeTrip.route.startLocation?.name || 'ตำแหน่งปัจจุบัน' }}</p>
                                <p class="text-xs text-gray-500 truncate">{{ activeTrip.route.startLocation?.address }}</p>
                            </div>
                            <div>
                                <p class="text-xs text-green-600 font-bold uppercase tracking-wider mb-0.5">จุดส่ง</p>
                                <p class="text-sm font-semibold truncate">{{ activeTrip.route.endLocation?.name }}</p>
                                <p class="text-xs text-gray-500 truncate">{{ activeTrip.route.endLocation?.address }}</p>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Driver/Passenger Section -->
                <div>
                    <h3 class="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4">การจัดการทริป</h3>
                    
                    <!-- Passenger View -->
                    <div v-if="role === 'PASSENGER'" class="space-y-4">
                        <div class="flex items-center gap-4 p-3 rounded-xl border border-gray-100 hover:border-blue-200 transition bg-white">
                            <img :src="activeTrip.route.driver.profilePicture || defaultAvatar" class="w-12 h-12 rounded-full object-cover ring-2 ring-gray-50" />
                            <div class="flex-1 min-w-0">
                                <p class="font-bold truncate text-gray-900">{{ activeTrip.route.driver.firstName }} {{ activeTrip.route.driver.lastName }}</p>
                                <div class="flex items-center gap-1">
                                    <span class="text-xs font-semibold text-yellow-600">★ {{ activeTrip.route.driver.ratingAverage?.toFixed(1) || '0.0' }}</span>
                                    <span class="text-xs text-gray-400">({{ activeTrip.route.driver.ratingCount || 0 }})</span>
                                </div>
                            </div>
                        </div>
                        <div class="space-y-3">
                            <h4 class="text-xs font-bold text-gray-400">เพื่อนร่วมทริป ({{ activeTrip.route.bookings.length }})</h4>
                            <div v-for="b in activeTrip.route.bookings" :key="b.id" class="flex items-center gap-3 p-2 border border-dashed border-gray-200 rounded-lg">
                                <img :src="b.passenger.profilePicture || defaultAvatar" class="w-8 h-8 rounded-full object-cover" />
                                <div class="flex-1 min-w-0">
                                    <p class="text-xs font-bold truncate">{{ b.passenger.firstName }} {{ b.passenger.lastName }}</p>
                                    <p class="text-[10px] text-gray-500">{{ b.numberOfSeats }} ที่นั่ง</p>
                                </div>
                                <span v-if="b.passenger.id === currentUserId" class="text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">คุณ</span>
                            </div>
                        </div>
                    </div>

                    <!-- Driver View -->
                    <div v-else class="space-y-6">
                        <!-- Pending Requests -->
                        <div v-if="pendingBookings.length > 0">
                            <h4 class="text-xs font-bold text-blue-600 uppercase mb-3 px-1">คำขอใหม่ ({{ pendingBookings.length }})</h4>
                            <div class="space-y-2">
                                <div v-for="b in pendingBookings" :key="b.id" 
                                    @click="focusOnBooking(b)"
                                    class="p-3 bg-blue-50/50 rounded-xl border cursor-pointer transition-all duration-300"
                                    :class="focusedBookingId === b.id ? 'border-orange-400 ring-2 ring-orange-100 shadow-lg scale-[1.02]' : 'border-blue-100 hover:border-blue-300'">
                                    <div class="flex items-center gap-3 mb-2">
                                        <img :src="b.passenger.profilePicture || defaultAvatar" class="w-8 h-8 rounded-full object-cover" />
                                        <div class="flex-1 min-w-0">
                                            <p class="text-sm font-bold truncate">{{ b.passenger.firstName }} {{ b.passenger.lastName }}</p>
                                            <p class="text-[10px] text-gray-500">{{ b.numberOfSeats }} ที่นั่ง</p>
                                        </div>
                                    </div>
                                    <div class="bg-white/50 p-2 rounded-lg border border-blue-50 mb-3 space-y-1">
                                        <div class="flex items-start gap-2">
                                            <span class="w-1.5 h-1.5 rounded-full mt-1" :class="focusedBookingId === b.id ? 'bg-orange-500' : 'bg-blue-400'"></span>
                                            <p class="text-[10px] text-gray-600 truncate">รับ: {{ b.pickupLocation.name || (b.pickupLocation.lat?.toFixed(4) + ', ' + b.pickupLocation.lng?.toFixed(4)) }}</p>
                                        </div>
                                        <div class="flex items-start gap-2">
                                            <span class="w-1.5 h-1.5 rounded-full mt-1" :class="focusedBookingId === b.id ? 'bg-red-500' : 'bg-red-400'"></span>
                                            <p class="text-[10px] text-gray-600 truncate">ส่ง: {{ b.dropoffLocation.name || (b.dropoffLocation.lat?.toFixed(4) + ', ' + b.dropoffLocation.lng?.toFixed(4)) }}</p>
                                        </div>
                                    </div>
                                    <div class="flex gap-2" @click.stop>
                                        <button @click="handleAcceptBooking(b.id)" class="flex-1 py-2 bg-blue-600 text-white text-xs font-bold rounded-lg hover:bg-blue-700 transition">รับ</button>
                                        <button @click="handleRejectBooking(b.id)" class="flex-1 py-2 bg-white border border-gray-200 text-gray-600 text-xs font-bold rounded-lg hover:bg-gray-100 transition">ปฏิเสธ</button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Confirmed / Check-in -->
                        <div v-if="confirmedBookings.length > 0">
                            <h4 class="text-xs font-bold text-gray-400 uppercase mb-3 px-1">
                                {{ activeTrip.route.status === 'IN_TRANSIT' ? 'รอรับผู้โดยสาร' : 'ผู้โดยสารที่ยืนยันแล้ว' }} ({{ confirmedBookings.length }})
                            </h4>
                            <div class="space-y-2">
                                <div v-for="b in confirmedBookings" :key="b.id" 
                                    @click="focusOnBooking(b)"
                                    class="p-3 bg-white rounded-xl border cursor-pointer transition-all duration-300"
                                    :class="focusedBookingId === b.id ? 'border-orange-400 ring-2 ring-orange-100 shadow-lg scale-[1.02]' : 'border-gray-100 hover:border-blue-200'">
                                    <div class="flex items-center justify-between">
                                        <div class="flex items-center gap-3">
                                            <img :src="b.passenger.profilePicture || defaultAvatar" class="w-8 h-8 rounded-full object-cover" />
                                            <div>
                                                <p class="text-sm font-bold">{{ b.passenger.firstName }}</p>
                                                <p class="text-[10px] text-blue-600 font-medium">{{ b.numberOfSeats }} ที่นั่ง</p>
                                            </div>
                                        </div>
                                        <div v-if="activeTrip.route.status === 'IN_TRANSIT'" class="flex gap-2" @click.stop>
                                            <button @click="openArrivalPicker(b)" title="แจ้งเตือนจะถึงแล้ว" class="p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition">
                                                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405C18.21 14.79 18 13.918 18 13V9a6 6 0 10-12 0v4c0 .918-.21 1.79-.595 2.595L4 17h5m6 0a3 3 0 11-6 0h6z"/></svg>
                                            </button>
                                            <button @click="handleUpdatePassengerStatus(b.id, 'IN_TRANSIT')" title="เช็คอิน" class="p-2 bg-green-100 text-green-600 rounded-lg hover:bg-green-200 transition">
                                                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>
                                            </button>
                                            <button @click="handleUpdatePassengerStatus(b.id, 'CANCELLED')" title="ไม่มา" class="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition">
                                                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
                                            </button>
                                        </div>
                                    </div>
                                    <div class="p-2 bg-gray-50 rounded-lg border border-dashed border-gray-200 space-y-1">
                                        <div class="flex items-start gap-2">
                                            <span class="w-1.5 h-1.5 rounded-full mt-1" :class="focusedBookingId === b.id ? 'bg-orange-500' : 'bg-blue-400'"></span>
                                            <p class="text-[10px] text-gray-600 truncate">รับ: {{ b.pickupLocation.name || (b.pickupLocation.lat?.toFixed(4) + ', ' + b.pickupLocation.lng?.toFixed(4)) }}</p>
                                        </div>
                                        <div class="flex items-start gap-2">
                                            <span class="w-1.5 h-1.5 rounded-full mt-1" :class="focusedBookingId === b.id ? 'bg-red-500' : 'bg-red-400'"></span>
                                            <p class="text-[10px] text-gray-600 truncate">ส่ง: {{ b.dropoffLocation.name || (b.dropoffLocation.lat?.toFixed(4) + ', ' + b.dropoffLocation.lng?.toFixed(4)) }}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- In-Transit / Dropping off -->
                        <div v-if="inTransitBookings.length > 0">
                            <h4 class="text-xs font-bold text-green-600 uppercase mb-3 px-1">อยู่ระหว่างการเดินทาง ({{ inTransitBookings.length }})</h4>
                            <div class="space-y-2">
                                <div v-for="b in inTransitBookings" :key="b.id" 
                                    @click="focusOnBooking(b)"
                                    class="p-3 bg-green-50/30 rounded-xl border cursor-pointer transition-all duration-300"
                                    :class="focusedBookingId === b.id ? 'border-orange-400 ring-2 ring-orange-100 shadow-lg scale-[1.02]' : 'border-green-100 hover:border-green-300'">
                                    <div class="flex items-center justify-between">
                                        <div class="flex items-center gap-3">
                                            <img :src="b.passenger.profilePicture || defaultAvatar" class="w-8 h-8 rounded-full object-cover" />
                                            <div>
                                                <p class="text-sm font-bold">{{ b.passenger.firstName }}</p>
                                                <span class="text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded">บนรถแล้ว</span>
                                            </div>
                                        </div>
                                        <button @click.stop="handleUpdatePassengerStatus(b.id, 'COMPLETED')" title="ส่งตัว" class="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
                                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>
                                        </button>
                                    </div>
                                    <div class="mt-2 p-2 bg-green-50/50 rounded-lg border border-dashed border-green-100 space-y-1">
                                        <div class="flex items-start gap-2">
                                            <span class="w-1.5 h-1.5 rounded-full mt-1" :class="focusedBookingId === b.id ? 'bg-red-500' : 'bg-red-400'"></span>
                                            <p class="text-[10px] text-gray-600 truncate">จุดส่ง: {{ b.dropoffLocation.name || (b.dropoffLocation.lat?.toFixed(4) + ', ' + b.dropoffLocation.lng?.toFixed(4)) }}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Completed -->
                        <div v-if="completedBookings.length > 0" class="opacity-60">
                            <h4 class="text-xs font-bold text-gray-400 uppercase mb-3 px-1">ส่งถึงที่หมายแล้ว ({{ completedBookings.length }})</h4>
                            <div class="space-y-2">
                                <div v-for="b in completedBookings" :key="b.id" class="p-2 flex items-center gap-3 grayscale">
                                    <img :src="b.passenger.profilePicture || defaultAvatar" class="w-6 h-6 rounded-full object-cover" />
                                    <p class="text-xs text-gray-600">{{ b.passenger.firstName }}</p>
                                </div>
                            </div>
                        </div>

                        <div v-if="activeTrip.route.bookings.length === 0" class="text-center py-8">
                            <div class="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-3">
                                <svg class="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/></svg>
                            </div>
                            <p class="text-xs text-gray-400">ยังไม่มีผู้โดยสารร่วมทริปนี้</p>
                        </div>
                    </div>
                </div>

                <!-- Actions -->
                <div class="pt-6 space-y-3">
                    <template v-if="role === 'DRIVER'">
                        <button v-if="canStartTrip" @click="openConfirm('start')" 
                            class="w-full py-4 px-6 bg-gradient-to-r from-blue-600 to-blue-500 text-white font-bold rounded-2xl shadow-xl shadow-blue-100 hover:scale-[1.02] active:scale-95 transition-all">
                            เริ่มต้นการเดินทาง
                        </button>
                        <button v-if="canFinishTrip" @click="openConfirm('finish')" 
                            class="w-full py-4 px-6 bg-gradient-to-r from-green-600 to-green-500 text-white font-bold rounded-2xl shadow-xl shadow-green-100 hover:scale-[1.02] active:scale-95 transition-all">
                            เสร็จสิ้นการเดินทาง
                        </button>
                    </template>
                    <button @click="role === 'DRIVER' ? openDriverReportModal() : openPassengerReportModal()" 
                        class="w-full py-4 px-6 bg-white border border-red-100 text-red-600 font-bold rounded-2xl hover:bg-red-50 active:scale-95 transition-all flex items-center justify-center gap-2">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        รายงานปัญหา
                    </button>
                    <button @click="showMapOnMobile = true" class="lg:hidden w-full py-3 px-6 text-gray-600 font-medium rounded-xl hover:bg-gray-100 transition">
                        ดูแผนที่
                    </button>
                </div>
            </div>
        </div>

        <!-- Map Area -->
        <div class="flex-1 relative bg-gray-50 p-4 flex flex-col" :class="{'hidden lg:flex': !showMapOnMobile}">
            <div class="relative bg-white rounded-3xl overflow-hidden shadow-lg border border-gray-100" style="flex:1; min-height: 400px;">
                <div ref="mapDisplay" style="width:100%; height:100%; min-height:400px;"></div>
                
                <!-- Reset View Button -->
                <transition name="fade">
                    <button v-if="focusedBookingId" 
                        @click="resetMapView"
                        class="absolute top-4 right-4 bg-white/90 backdrop-blur px-4 py-2 rounded-xl shadow-lg border border-blue-100 text-blue-600 text-xs font-bold flex items-center gap-2 hover:bg-white transition-all active:scale-95">
                        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"/></svg>
                        กลับสู่ภาพรวมทริป
                    </button>
                </transition>
            </div>
            <!-- Mobile Map Close Button -->
            <button v-if="showMapOnMobile" @click="showMapOnMobile = false" class="lg:hidden absolute top-4 left-4 z-20 bg-white/90 backdrop-blur p-2 rounded-full shadow-lg">
                <svg class="w-6 h-6 text-gray-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
            </button>

            <!-- Floating Route Info -->
            <div class="absolute bottom-6 left-1/2 -translate-x-1/2 w-[90%] lg:w-auto min-w-[300px] bg-white/90 backdrop-blur-md p-4 rounded-2xl shadow-2xl border border-white/50 z-10 flex items-center justify-between gap-6 pointer-events-none lg:pointer-events-auto">
                <div class="flex items-center gap-4">
                    <div class="p-2 bg-blue-100 rounded-lg text-blue-600">
                        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                    </div>
                    <div v-if="role === 'PASSENGER' && myBooking">
                        <p class="text-[10px] text-gray-500 font-bold uppercase tracking-widest">จุดรับ → จุดส่ง</p>
                        <p class="text-sm font-black text-gray-900 truncate max-w-[180px]">{{ myBooking.pickupLocation?.name || 'จุดรับ' }} → {{ myBooking.dropoffLocation?.name || 'จุดส่ง' }}</p>
                    </div>
                    <div v-else>
                        <p class="text-[10px] text-gray-500 font-bold uppercase tracking-widest">ระยะทาง / เวลา</p>
                        <p class="text-lg font-black text-gray-900">{{ activeTrip.route.distance || '...' }} <span class="text-gray-400 font-normal">|</span> {{ activeTrip.route.duration || '...' }}</p>
                    </div>
                </div>
                <div class="h-10 w-px bg-gray-200 hidden sm:block"></div>
                <div class="hidden sm:block text-right">
                    <p class="text-[10px] text-gray-500 font-bold uppercase tracking-widest">ผู้ร่วมทริป</p>
                    <div class="flex items-center justify-end -space-x-2 mt-1">
                        <img v-for="b in activeTrip.route.bookings.slice(0, 3)" :key="b.id" :src="b.passenger.profilePicture || defaultAvatar" class="w-8 h-8 rounded-full border-2 border-white object-cover shadow-sm" />
                        <div v-if="activeTrip.route.bookings.length > 3" class="w-8 h-8 rounded-full border-2 border-white bg-gray-100 text-[10px] flex items-center justify-center font-bold text-gray-500 shadow-sm">+{{ activeTrip.route.bookings.length - 3 }}</div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Review Modal / Overlay -->
        <div v-if="isTripCompleted" class="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div class="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" @click="closeReview"></div>
            <div class="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
                <div class="p-8 text-center bg-gradient-to-b from-blue-50 to-white">
                    <div class="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6 scale-110">
                        <svg class="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                    <h2 class="text-3xl font-black text-gray-900 mb-2">ถึงที่หมายแล้ว!</h2>
                    <p class="text-gray-600 mb-6">การเดินทางของคุณเสร็จสิ้นเรียบร้อยแล้ว<br/>รบกวนช่วยแบ่งปันความประทับใจเพื่อพัฒนาชุมชนของเรา</p>
                    
                    <div v-if="role === 'PASSENGER'" class="space-y-5 text-left">
                        <!-- Rating -->
                        <div class="flex items-center justify-center gap-2">
                            <button v-for="s in 5" :key="s" @click="rating = s" class="p-1 transition-transform active:scale-95" :class="s <= rating ? 'text-yellow-400' : 'text-gray-200'">
                                <svg class="w-10 h-10 fill-current" viewBox="0 0 20 20">
                                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                </svg>
                            </button>
                        </div>
                        <!-- Comment -->
                        <textarea v-model="comment" placeholder="พิมพ์ความเศร้าหรือความสุขของคุณที่นี่..." class="w-full h-28 p-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:bg-white transition outline-none resize-none text-sm"></textarea>
                        
                        <!-- File Attachments -->
                        <div>
                            <label class="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">แนบไฟล์ (สูงสุด 3 ไฟล์ — รูป/วิดีโอ/เสียง)</label>
                            <div class="flex flex-wrap gap-2">
                                <div v-for="(f, i) in reviewFiles" :key="i" class="relative w-16 h-16 rounded-xl overflow-hidden border border-gray-200 bg-gray-100">
                                    <img v-if="f.type.startsWith('image/')" :src="f.preview" class="w-full h-full object-cover" />
                                    <div v-else class="w-full h-full flex flex-col items-center justify-center">
                                        <svg v-if="f.type.startsWith('video/')" class="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M3 8a2 2 0 012-2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z"/></svg>
                                        <svg v-else class="w-6 h-6 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"/></svg>
                                        <span class="text-[9px] text-gray-500 mt-0.5">{{ f.type.startsWith('video/') ? 'วิดีโอ' : 'เสียง' }}</span>
                                    </div>
                                    <button @click="removeReviewFile(i)" class="absolute top-0.5 right-0.5 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
                                        <svg class="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M6 18L18 6M6 6l12 12"/></svg>
                                    </button>
                                </div>
                                <label v-if="reviewFiles.length < 3" class="w-16 h-16 flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-300 cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition">
                                    <svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
                                    <span class="text-[9px] text-gray-400 mt-0.5">เพิ่ม</span>
                                    <input type="file" accept="image/*,video/*,audio/*" class="hidden" @change="onReviewFileChange" />
                                </label>
                            </div>
                        </div>

                        <div class="flex flex-col gap-3 pt-1">
                            <button @click="submitReview" :disabled="isSubmittingReview" class="w-full py-4 bg-blue-600 text-white font-bold rounded-2xl shadow-xl shadow-blue-100 hover:bg-blue-700 disabled:opacity-50 transition">
                                {{ isSubmittingReview ? 'กำลังส่งรีวิว...' : 'บันทึกและให้คะแนน' }}
                            </button>
                            <button @click="closeReview" class="text-sm text-gray-400 font-medium hover:text-gray-600">ข้ามขั้นตอนความสัมพันธ์</button>
                        </div>
                    </div>
                    <div v-else class="flex flex-col gap-3">
                        <button @click="closeReview" class="w-full py-4 bg-blue-600 text-white font-bold rounded-2xl shadow-xl shadow-blue-100 hover:bg-blue-700 transition">
                            ตกลง
                        </button>
                    </div>
                </div>
            </div>
        </div>

        <!-- Confirm Dialog -->
        <div v-if="showConfirmDialog" class="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div class="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" @click="showConfirmDialog = false"></div>
            <div class="relative w-full max-w-sm bg-white rounded-3xl shadow-2xl p-8 text-center">
                <div class="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5"
                    :class="confirmAction === 'start' ? 'bg-blue-100' : 'bg-green-100'">
                    <svg v-if="confirmAction === 'start'" class="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                    <svg v-else class="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>
                </div>
                <h3 class="text-xl font-black text-gray-900 mb-2">{{ confirmAction === 'start' ? 'เริ่มต้นการเดินทาง?' : 'สิ้นสุดการเดินทาง?' }}</h3>
                <p class="text-sm text-gray-500 mb-8">
                    {{ confirmAction === 'start'
                        ? 'หลังจากเริ่มทริปแล้ว ระบบจะไม่อนุญาตให้รับผู้โดยสารเพิ่มระหว่างทาง และคำขอทั้งหมดจะถูกปิดรับ'
                        : 'การจบทริปไม่สามารถย้อนกลับได้ ผู้โดยสารที่ยังอยู่ระหว่างทางจะถูกบันทึกว่าถึงจุดหมายแล้ว' }}
                </p>
                <div class="flex gap-3">
                    <button @click="showConfirmDialog = false" class="flex-1 py-3 border border-gray-200 text-gray-600 font-bold rounded-2xl hover:bg-gray-50 transition">ยกเลิก</button>
                    <button @click="confirmAction === 'start' ? executeStart() : executeFinish()" 
                        class="flex-1 py-3 text-white font-bold rounded-2xl transition shadow-lg"
                        :class="confirmAction === 'start' ? 'bg-blue-600 hover:bg-blue-700 shadow-blue-100' : 'bg-green-600 hover:bg-green-700 shadow-green-100'">
                        ยืนยัน
                    </button>
                </div>
            </div>
        </div>

        <!-- Arrival Time Picker Modal -->
        <div v-if="showArrivalPicker" class="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div class="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" @click="showArrivalPicker = false"></div>
            <div class="relative w-full max-w-sm bg-white rounded-3xl shadow-2xl p-8 text-center">
                <div class="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-5">
                    <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                </div>
                <h3 class="text-xl font-black text-gray-900 mb-2">จะถึงภายในกี่นาที?</h3>
                <p class="text-sm text-gray-500 mb-6 font-medium">แจ้งให้คุณ <span class="text-blue-600">{{ selectedBookingForArrival?.passenger.firstName }}</span> ทราบว่าคุณใกล้จะถึงแล้ว</p>
                
                <div class="grid grid-cols-3 gap-2 mb-8">
                    <button v-for="m in [5,10,15,20,25,30]" :key="m" @click="arrivalMinutes = m" 
                        class="py-3 px-2 rounded-xl border-2 font-bold transition text-sm"
                        :class="arrivalMinutes === m ? 'border-blue-600 bg-blue-50 text-blue-600' : 'border-gray-100 text-gray-400 hover:border-gray-200'">
                        {{ m }} นาที
                    </button>
                </div>

                <div class="flex gap-3">
                    <button @click="showArrivalPicker = false" class="flex-1 py-3 border border-gray-200 text-gray-600 font-bold rounded-2xl hover:bg-gray-50 transition">ยกเลิก</button>
                    <button @click="submitArrivalNotif" :disabled="isSubmittingArrival" 
                        class="flex-1 py-3 bg-blue-600 text-white font-bold rounded-2xl shadow-lg shadow-blue-100 hover:bg-blue-700 disabled:opacity-50 transition">
                        {{ isSubmittingArrival ? 'กำลังส่ง...' : 'ยืนยัน' }}
                    </button>
                </div>
            </div>
        </div>

        <!-- Driver Report Modal -->
        <div v-if="showDriverReport" class="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div class="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" @click="showDriverReport = false"></div>
            <div class="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto">
                <div class="p-6">
                    <div class="flex items-center justify-between mb-6">
                        <h3 class="text-lg font-black text-gray-900">รายงานปัญหา</h3>
                        <button @click="showDriverReport = false" class="p-2 hover:bg-gray-100 rounded-full"><svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg></button>
                    </div>

                    <!-- Type Toggle -->
                    <div class="flex bg-gray-100 rounded-xl p-1 mb-6">
                        <button @click="driverReportType = 'incident'" class="flex-1 py-2 text-sm font-bold rounded-lg transition" :class="driverReportType === 'incident' ? 'bg-white shadow text-gray-900' : 'text-gray-500'">รายงานเหตุการณ์</button>
                        <button @click="driverReportType = 'passenger'" class="flex-1 py-2 text-sm font-bold rounded-lg transition" :class="driverReportType === 'passenger' ? 'bg-white shadow text-gray-900' : 'text-gray-500'">รายงานผู้โดยสาร</button>
                    </div>

                    <div class="space-y-4">
                        <!-- Passenger Dropdown (only for passenger report) -->
                        <div v-if="driverReportType === 'passenger'">
                            <label class="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 block">เลือกผู้โดยสาร</label>
                            <select v-model="driverReportPassengerId" class="w-full p-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white">
                                <option value="" disabled>-- เลือกผู้โดยสาร --</option>
                                <option v-for="b in reportableBookings" :key="b.id" :value="b.passenger.id">
                                    {{ b.passenger.firstName }} {{ b.passenger.lastName }}
                                </option>
                            </select>
                        </div>

                        <!-- Category -->
                        <div>
                            <label class="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 block">ประเภทปัญหา</label>
                            <select v-model="driverReportCategory" class="w-full p-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white">
                                <option v-if="driverReportType === 'passenger'" value="PASSENGER_ISSUE">พฤติกรรมไม่เหมาะสม</option>
                                <option v-if="driverReportType === 'passenger'" value="NO_SHOW">ผู้โดยสารไม่มาพบตามจุดนัดหมาย</option>
                                <option v-if="driverReportType === 'passenger'" value="LATE_ISSUE">ผู้โดยสารมาช้ามาก</option>
                                <option v-if="driverReportType === 'passenger'" value="WRONG_INFO">ผู้โดยสารไม่ใช่คนเดียวกับที่จอง</option>
                                
                                <option v-if="driverReportType === 'incident'" value="VEHICLE_ISSUE">ปัญหายานพาหนะ</option>
                                <option v-if="driverReportType === 'incident'" value="ROAD_ISSUE">ปัญหาถนน/เส้นทาง</option>
                                <option value="SAFETY_ISSUE">ปัญหาความปลอดภัย</option>
                                <option value="OTHER">อื่นๆ</option>
                            </select>
                        </div>

                        <!-- Description -->
                        <div>
                            <label class="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 block">รายละเอียด</label>
                            <textarea v-model="driverReportDescription" rows="4" placeholder="อธิบายเหตุการณ์ที่เกิดขึ้น..." class="w-full p-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none"></textarea>
                        </div>

                        <!-- File Attachment -->
                        <div>
                            <label class="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">แนบไฟล์ (สูงสุด 3 — รูป/วิดีโอ/เสียง)</label>
                            <div class="flex flex-wrap gap-2">
                                <div v-for="(f, i) in reportFiles" :key="i" class="relative w-16 h-16 rounded-xl overflow-hidden border border-gray-200 bg-gray-100">
                                    <img v-if="f.type.startsWith('image/')" :src="f.preview" class="w-full h-full object-cover" />
                                    <div v-else class="w-full h-full flex flex-col items-center justify-center">
                                        <svg v-if="f.type.startsWith('video/')" class="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M3 8a2 2 0 012-2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z"/></svg>
                                        <svg v-else class="w-6 h-6 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"/></svg>
                                        <span class="text-[9px] text-gray-500 mt-0.5">{{ f.type.startsWith('video/') ? 'วิดีโอ' : 'เสียง' }}</span>
                                    </div>
                                    <button @click="removeReportFile(i)" class="absolute top-0.5 right-0.5 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
                                        <svg class="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M6 18L18 6M6 6l12 12"/></svg>
                                    </button>
                                </div>
                                <label v-if="reportFiles.length < 3" class="w-16 h-16 flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-300 cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition">
                                    <svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
                                    <span class="text-[9px] text-gray-400 mt-0.5">เพิ่ม</span>
                                    <input type="file" accept="image/*,video/*,audio/*" class="hidden" @change="onReportFileChange" />
                                </label>
                            </div>
                        </div>

                        <button @click="submitDriverReport" :disabled="isSubmittingReport" class="w-full py-3.5 bg-red-600 text-white font-bold rounded-2xl hover:bg-red-700 disabled:opacity-50 transition mt-2">
                            {{ isSubmittingReport ? 'กำลังส่ง...' : 'ส่งรายงาน' }}
                        </button>
                    </div>
                </div>
            </div>
        </div>

        <!-- Passenger Report Modal -->
        <div v-if="showPassengerReport" class="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div class="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" @click="showPassengerReport = false"></div>
            <div class="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto">
                <div class="p-6">
                    <div class="flex items-center justify-between mb-6">
                        <h3 class="text-lg font-black text-gray-900">รายงานปัญหา</h3>
                        <button @click="showPassengerReport = false" class="p-2 hover:bg-gray-100 rounded-full"><svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg></button>
                    </div>
                    <div class="space-y-4">
                        <div>
                            <label class="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 block">ประเภทปัญหา</label>
                            <select v-model="passengerReportCategory" class="w-full p-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white">
                                <option value="VEHICLE_ISSUE">ปัญหายานพาหนะ</option>
                                <option value="SAFETY_ISSUE">ปัญหาความปลอดภัย</option>
                                <option value="PASSENGER_ISSUE">พฤติกรรมไม่เหมาะสม</option>
                                <option value="LATE_ISSUE">คนขับมาช้ากว่ากำหนดมาก</option>
                                <option value="WRONG_INFO">ข้อมูลคนขับหรือรถไม่ตรงปก</option>
                                <option value="PAYMENT_ISSUE">ปัญหาการชำระเงิน</option>
                                <option value="APP_ISSUE">แอปมีปัญหา/ขัดข้อง</option>
                                <option value="OTHER">อื่นๆ</option>
                            </select>
                        </div>
                        <div>
                            <label class="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 block">รายละเอียด</label>
                            <textarea v-model="passengerReportDescription" rows="4" placeholder="อธิบายปัญหาที่พบ..." class="w-full p-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none"></textarea>
                        </div>
                        <!-- File Attachment -->
                        <div>
                            <label class="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">แนบไฟล์ (สูงสุด 3 — รูป/วิดีโอ/เสียง)</label>
                            <div class="flex flex-wrap gap-2">
                                <div v-for="(f, i) in reportFiles" :key="i" class="relative w-16 h-16 rounded-xl overflow-hidden border border-gray-200 bg-gray-100">
                                    <img v-if="f.type.startsWith('image/')" :src="f.preview" class="w-full h-full object-cover" />
                                    <div v-else class="w-full h-full flex flex-col items-center justify-center">
                                        <svg v-if="f.type.startsWith('video/')" class="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M3 8a2 2 0 012-2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z"/></svg>
                                        <svg v-else class="w-6 h-6 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"/></svg>
                                        <span class="text-[9px] text-gray-500 mt-0.5">{{ f.type.startsWith('video/') ? 'วิดีโอ' : 'เสียง' }}</span>
                                    </div>
                                    <button @click="removeReportFile(i)" class="absolute top-0.5 right-0.5 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
                                        <svg class="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M6 18L18 6M6 6l12 12"/></svg>
                                    </button>
                                </div>
                                <label v-if="reportFiles.length < 3" class="w-16 h-16 flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-300 cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition">
                                    <svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
                                    <span class="text-[9px] text-gray-400 mt-0.5">เพิ่ม</span>
                                    <input type="file" accept="image/*,video/*,audio/*" class="hidden" @change="onReportFileChange" />
                                </label>
                            </div>
                        </div>
                        <button @click="submitPassengerReport" :disabled="isSubmittingReport" class="w-full py-3.5 bg-red-600 text-white font-bold rounded-2xl hover:bg-red-700 disabled:opacity-50 transition mt-2">
                            {{ isSubmittingReport ? 'กำลังส่ง...' : 'ส่งรายงาน' }}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'

definePageMeta({ middleware: 'auth' })

const { $api } = useNuxtApp()
const { user } = useAuth()
const { toast } = useToast()
const { onEvent } = useSocket()
const router = useRouter()
const routePath = useRoute()
import { useNotifications } from '~/composables/useNotifications'

const isLoading = ref(true)
const activeTrip = ref(null)
const role = ref(null)
const isTripCompleted = ref(false)
const showMapOnMobile = ref(false)

const { notifications, isOpen: isChatOpen, resetChat } = useNotifications()

const openBubbleChat = () => {
    isChatOpen.value = true
}

const currentUserId = computed(() => user.value?.id)
const isAdminPage = computed(() => routePath.path.startsWith('/admin'))
const defaultAvatar = 'https://ui-avatars.com/api/?background=random'

// Booking of the current passenger (for map pickup/dropoff display)
const myBooking = computed(() => {
    if (role.value !== 'PASSENGER' || !activeTrip.value) return null
    return activeTrip.value.route.bookings?.find(b => b.passengerId === currentUserId.value) || null
})

// Bookings that can be reported by driver (CONFIRMED + IN_TRANSIT have passenger info)
const reportableBookings = computed(() => {
    if (!activeTrip.value) return []
    return activeTrip.value.route.bookings?.filter(b =>
        ['CONFIRMED', 'IN_TRANSIT', 'PENDING'].includes(b.status) && b.passenger
    ) || []
})

const statusText = computed(() => {
    if (!activeTrip.value) return ''
    if (activeTrip.value.route.status === 'IN_TRANSIT') return 'กำลังเดินทาง'
    if (activeTrip.value.route.status === 'FULL') return 'พร้อมออกเดินทาง (เต็ม)'
    return 'เตรียมความพร้อม'
})

// --- Booking Filters ---
const pendingBookings = computed(() => 
    activeTrip.value?.route?.bookings?.filter(b => b.status === 'PENDING') || []
)
const confirmedBookings = computed(() => 
    activeTrip.value?.route?.bookings?.filter(b => b.status === 'CONFIRMED') || []
)
const inTransitBookings = computed(() => 
    activeTrip.value?.route?.bookings?.filter(b => b.status === 'IN_TRANSIT') || []
)
const completedBookings = computed(() => 
    activeTrip.value?.route?.bookings?.filter(b => b.status === 'COMPLETED') || []
)

const canStartTrip = computed(() => {
    if (!activeTrip.value) return false
    const route = activeTrip.value.route
    // สามารถเริ่มได้ถ้าสถานะเป็น AVAILABLE หรือ FULL และไม่มีงาน PENDING
    return (route.status === 'AVAILABLE' || route.status === 'FULL') && pendingBookings.value.length === 0
})

const canFinishTrip = computed(() => {
    if (!activeTrip.value || activeTrip.value.route.status !== 'IN_TRANSIT') return false
    // ต้องจัดการผู้โดยสารให้หมด (Checked-out หรือ Cancelled/No Show)
    // ดังนั้นไมโครการจัดการคือ CONFIRMED และ IN_TRANSIT ต้องเป็น 0
    return confirmedBookings.value.length === 0 && inTransitBookings.value.length === 0
})

// --- Review State ---
const rating = ref(5)
const comment = ref('')
const isSubmittingReview = ref(false)
const reviewFiles = ref([]) // { file, type, preview }

function onReviewFileChange(e) {
    const file = e.target.files?.[0]
    if (!file || reviewFiles.value.length >= 3) return
    const preview = file.type.startsWith('image/') ? URL.createObjectURL(file) : null
    reviewFiles.value.push({ file, type: file.type, preview })
    e.target.value = '' // reset input so same file can be picked again
}

function removeReviewFile(idx) {
    const f = reviewFiles.value[idx]
    if (f?.preview) URL.revokeObjectURL(f.preview)
    reviewFiles.value.splice(idx, 1)
}

// --- Confirm Dialog State ---
const showConfirmDialog = ref(false)
const confirmAction = ref('') // 'start' | 'finish'

// --- Arrival Notif State ---
const showArrivalPicker = ref(false)
const selectedBookingForArrival = ref(null)
const arrivalMinutes = ref(5)
const isSubmittingArrival = ref(false)

function openArrivalPicker(booking) {
    selectedBookingForArrival.value = booking
    arrivalMinutes.value = 5
    showArrivalPicker.value = true
}

async function submitArrivalNotif() {
    if (!selectedBookingForArrival.value || isSubmittingArrival.value) return
    isSubmittingArrival.value = true
    try {
        await $api(`/bookings/${selectedBookingForArrival.value.id}/notify-arrival`, {
            method: 'PATCH',
            body: { minutes: arrivalMinutes.value }
        })
        toast.success('แจ้งเตือนแล้ว', `แจ้งผู้โดยสารว่าคุณจะถึงใน ${arrivalMinutes.value} นาที`)
        showArrivalPicker.value = false
    } catch (err) {
        toast.error('เกิดข้อผิดพลาด', err.data?.message || 'ไม่สามารถแจ้งเตือนได้')
    } finally {
        isSubmittingArrival.value = false
    }
}

function openConfirm(action) {
    confirmAction.value = action
    showConfirmDialog.value = true
}

async function executeStart() {
    showConfirmDialog.value = false
    await handleStartTrip()
}

async function executeFinish() {
    showConfirmDialog.value = false
    await handleFinishTrip()
}

// --- Report State ---
const showDriverReport = ref(false)
const showPassengerReport = ref(false)
const isSubmittingReport = ref(false)
const reportFiles = ref([]) // shared between both modals

// Driver report
const driverReportType = ref('incident') // 'incident' | 'passenger'
const driverReportCategory = ref('SAFETY_ISSUE')
const driverReportDescription = ref('')
const driverReportPassengerId = ref('')

// Passenger report
const passengerReportCategory = ref('VEHICLE_ISSUE')
const passengerReportDescription = ref('')

function onReportFileChange(e) {
    const file = e.target.files?.[0]
    if (!file || reportFiles.value.length >= 3) return
    const preview = file.type.startsWith('image/') ? URL.createObjectURL(file) : null
    reportFiles.value.push({ file, type: file.type, preview })
    e.target.value = ''
}

function removeReportFile(idx) {
    const f = reportFiles.value[idx]
    if (f?.preview) URL.revokeObjectURL(f.preview)
    reportFiles.value.splice(idx, 1)
}

function openDriverReportModal() {
    driverReportType.value = 'incident'
    driverReportCategory.value = 'SAFETY_ISSUE'
    driverReportDescription.value = ''
    driverReportPassengerId.value = ''
    reportFiles.value = []
    showDriverReport.value = true
}

function openPassengerReportModal() {
    passengerReportCategory.value = 'VEHICLE_ISSUE'
    passengerReportDescription.value = ''
    reportFiles.value = []
    showPassengerReport.value = true
}

// --- Map Logic ---
const GMAPS_CB = '__gmapsReady__'
const mapDisplay = ref(null)
const focusedBookingId = ref(null)
const mapReady = ref(false)
let gmap = null
let polyline = null
let markers = []
let geocoder = null

async function fetchActiveTrip() {
    isLoading.value = true
    try {
        const res = await $api('/routes/active')
        if (res) {
            activeTrip.value = res
            role.value = res.role
            if (activeTrip.value.route.status === 'COMPLETED') {
                isTripCompleted.value = true
            }
        }
    } catch (err) {
        console.error('Error fetching active trip:', err)
        activeTrip.value = null
    } finally {
        isLoading.value = false
    }
}

// --- Map functions (copied from myRoute) ---
function waitMapReady() {
    return new Promise((resolve) => {
        if (mapReady.value) return resolve(true)
        const t = setInterval(() => {
            if (mapReady.value) { clearInterval(t); resolve(true) }
        }, 50)
    })
}

function initializeMap() {
    if (!mapDisplay.value) return
    // Bug 1+2 fix: always reset gmap so map re-initializes after SPA navigation or socket reload
    if (gmap) {
        gmap = null
        mapReady.value = false
    }
    gmap = new google.maps.Map(mapDisplay.value, {
        center: { lat: 13.7563, lng: 100.5018 },
        zoom: 6,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: true,
    })
    geocoder = new google.maps.Geocoder()
    mapReady.value = true
}

async function updateMap(coords, polylineStr, stopsCoords) {
    await waitMapReady()
    if (!gmap) return

    // cleanup
    markers.forEach(m => m.setMap(null))
    markers = []
    if (polyline) { polyline.setMap(null); polyline = null }

    const start = { lat: Number(coords[0][0]), lng: Number(coords[0][1]) }
    const end = { lat: Number(coords[1][0]), lng: Number(coords[1][1]) }

    const startMarker = new google.maps.Marker({ position: start, map: gmap, label: 'A' })
    const endMarker = new google.maps.Marker({ position: end, map: gmap, label: 'B' })
    markers.push(startMarker, endMarker)

    if (Array.isArray(stopsCoords) && stopsCoords.length) {
        stopsCoords.forEach((s, idx) => {
            const m = new google.maps.Marker({
                position: { lat: s.lat, lng: s.lng },
                map: gmap,
                icon: 'http://maps.google.com/mapfiles/ms/icons/green-dot.png',
                title: s.name || `จุดแวะ ${idx + 1}`
            })
            markers.push(m)
        })
    }

    if (polylineStr && google.maps.geometry?.encoding) {
        const path = google.maps.geometry.encoding.decodePath(polylineStr)
        polyline = new google.maps.Polyline({
            path,
            map: gmap,
            strokeColor: '#2563eb',
            strokeOpacity: 0.9,
            strokeWeight: 5,
        })
        const bounds = new google.maps.LatLngBounds()
        path.forEach(p => bounds.extend(p))
        if (stopsCoords?.length) stopsCoords.forEach(s => bounds.extend(new google.maps.LatLng(s.lat, s.lng)))
        gmap.fitBounds(bounds)
    } else {
        const bounds = new google.maps.LatLngBounds()
        bounds.extend(start)
        bounds.extend(end)
        if (stopsCoords?.length) stopsCoords.forEach(s => bounds.extend(new google.maps.LatLng(s.lat, s.lng)))
        gmap.fitBounds(bounds)
    }
}

function initMap() {
    if (!activeTrip.value) return
    initializeMap()
    const route = activeTrip.value.route

    // Feature 4: Passenger sees their pickup → dropoff route, not the full trip
    if (role.value === 'PASSENGER' && myBooking.value?.pickupLocation?.lat && myBooking.value?.dropoffLocation?.lat) {
        const pickup = myBooking.value.pickupLocation
        const dropoff = myBooking.value.dropoffLocation
        const ds = new google.maps.DirectionsService()
        ds.route(
            {
                origin: { lat: pickup.lat, lng: pickup.lng },
                destination: { lat: dropoff.lat, lng: dropoff.lng },
                travelMode: google.maps.TravelMode.DRIVING
            },
            (result, status) => {
                const polylineStr = status === 'OK' ? result.routes?.[0]?.overview_polyline : null
                updateMap([[pickup.lat, pickup.lng], [dropoff.lat, dropoff.lng]], polylineStr, [])
            }
        )
    } else {
        const start = route.startLocation
        const end = route.endLocation
        if (!start?.lat || !end?.lat) return
        updateMap(
            [[start.lat, start.lng], [end.lat, end.lng]],
            route.routePolyline || null,
            []
        )
    }
    // click map to reset
    gmap.addListener('click', () => {
        if (focusedBookingId.value) resetMapView()
    })
}

function resetMapView() {
    if (!activeTrip.value) return
    focusedBookingId.value = null
    const route = activeTrip.value.route
    const start = route.startLocation
    const end = route.endLocation
    if (!start?.lat || !end?.lat) return
    updateMap(
        [[start.lat, start.lng], [end.lat, end.lng]],
        route.routePolyline || null,
        []
    )
}

function focusOnBooking(booking) {
    if (!gmap) return
    if (focusedBookingId.value === booking.id) {
        resetMapView()
        return
    }
    focusedBookingId.value = booking.id
    const pickup = booking.pickupLocation
    const dropoff = booking.dropoffLocation
    if (!pickup?.lat || !dropoff?.lat) return

    // Bug 3 fix: use DirectionsService to draw a real polyline between pickup → dropoff
    const ds = new google.maps.DirectionsService()
    ds.route(
        {
            origin: { lat: pickup.lat, lng: pickup.lng },
            destination: { lat: dropoff.lat, lng: dropoff.lng },
            travelMode: google.maps.TravelMode.DRIVING
        },
        (result, status) => {
            if (status === 'OK') {
                // In JS API DirectionsResult, overview_polyline is a string
                const polylineStr = result.routes?.[0]?.overview_polyline || null
                updateMap(
                    [[pickup.lat, pickup.lng], [dropoff.lat, dropoff.lng]],
                    polylineStr,
                    []
                )
            } else {
                // Fallback: just show markers with bounds
                updateMap(
                    [[pickup.lat, pickup.lng], [dropoff.lat, dropoff.lng]],
                    null,
                    []
                )
            }
        }
    )
}


// --- Actions ---
async function handleFinishTrip() {
    if (!activeTrip.value) return
    const routeId = activeTrip.value.route.id
    try {
        await $api(`/routes/${routeId}/complete`, { method: 'PATCH' })
        toast.success('เรียบร้อย', 'สิ้นสุดการเดินทางแล้ว')
        isTripCompleted.value = true
    } catch (err) {
        toast.error('เกิดข้อผิดพลาด', err.data?.message || 'ไม่สามารถจบงานได้')
    }
}

async function handleStartTrip() {
    if (!activeTrip.value) return
    const routeId = activeTrip.value.route.id
    try {
        await $api(`/routes/${routeId}/start`, { method: 'PATCH' })
        toast.success('เริ่มต้นการเดินทาง', 'ขอให้เดินทางโดยสวัสดิภาพ')
        await fetchActiveTrip()
        nextTick(() => { if (mapDisplay.value && activeTrip.value) initMap() })
    } catch (err) {
        toast.error('เกิดข้อผิดพลาด', err.data?.message || 'ไม่สามารถเริ่มทริปได้')
    }
}

async function handleAcceptBooking(bookingId) {
    try {
        await $api(`/bookings/${bookingId}/status`, {
            method: 'PATCH',
            body: { status: 'CONFIRMED' }
        })
        toast.success('สำเร็จ', 'รับผู้โดยสารเรียบร้อยแล้ว')
        await fetchActiveTrip()
        nextTick(() => { if (mapDisplay.value && activeTrip.value) initMap() })
    } catch (err) {
        toast.error('เกิดข้อผิดพลาด', err.data?.message || 'ไม่สามารถรับผู้โดยสารได้')
    }
}

async function handleRejectBooking(bookingId) {
    try {
        await $api(`/bookings/${bookingId}/status`, {
            method: 'PATCH',
            body: { status: 'REJECTED' }
        })
        toast.success('สำเร็จ', 'ปฏิเสธคำขอเรียบร้อยแล้ว')
        await fetchActiveTrip()
        nextTick(() => { if (mapDisplay.value && activeTrip.value) initMap() })
    } catch (err) {
        toast.error('เกิดข้อผิดพลาด', err.data?.message || 'ไม่สามารถดำเนินการได้')
    }
}

async function handleUpdatePassengerStatus(bookingId, status, reason = '') {
    try {
        await $api(`/bookings/${bookingId}/passenger-status`, {
            method: 'PATCH',
            body: { status, reason }
        })
        const msg = status === 'IN_TRANSIT' ? 'เช็คอินผู้โดยสารเรียบร้อย' : (status === 'COMPLETED' ? 'ส่งผู้โดยสารเรียบร้อย' : 'ยกเลิก (No Show) เรียบร้อย')
        toast.success('สำเร็จ', msg)
        await fetchActiveTrip()
        nextTick(() => { if (mapDisplay.value && activeTrip.value) initMap() })
    } catch (err) {
        toast.error('เกิดข้อผิดพลาด', err.data?.message || 'ไม่สามารถทำรายการได้')
    }
}

async function submitReview() {
    if (isSubmittingReview.value) return
    isSubmittingReview.value = true
    try {
        const fd = new FormData()
        fd.append('bookingId', activeTrip.value.bookingId)
        fd.append('rating', String(rating.value))
        fd.append('comment', comment.value)
        reviewFiles.value.forEach(f => fd.append('images', f.file))

        await $api('/reviews', { method: 'POST', body: fd })
        toast.success('ขอบคุณ', 'เราบันทึกรีวิวของคุณแล้วนะ')
        reviewFiles.value.forEach(f => { if (f.preview) URL.revokeObjectURL(f.preview) })
        reviewFiles.value = []
        closeReview()
    } catch (err) {
        toast.error('เกิดข้อผิดพลาด', err.data?.message || 'ไม่สามารถส่งรีวิวได้')
    } finally {
        isSubmittingReview.value = false
    }
}

async function submitDriverReport() {
    if (isSubmittingReport.value) return
    if (!driverReportDescription.value.trim() || driverReportDescription.value.length < 5) {
        toast.error('กรุณากรอกรายละเอียด', 'รายละเอียดต้องมีอย่างน้อย 5 ตัวอักษร')
        return
    }
    if (driverReportType.value === 'passenger' && !driverReportPassengerId.value) {
        toast.error('กรุณาเลือกผู้โดยสาร', 'กรุณาเลือกผู้โดยสารที่ต้องการรายงาน')
        return
    }
    isSubmittingReport.value = true
    try {
        const fd = new FormData()
        fd.append('type', 'DRIVER')
        fd.append('category', driverReportCategory.value)
        fd.append('description', driverReportDescription.value)
        fd.append('routeId', activeTrip.value.route.id)
        if (driverReportType.value === 'passenger' && driverReportPassengerId.value) {
            fd.append('targetUserId', driverReportPassengerId.value)
        }
        reportFiles.value.forEach(f => fd.append('images', f.file))

        await $api('/reports', { method: 'POST', body: fd })
        toast.success('ส่งรายงานแล้ว', 'ทีมงานจะตรวจสอบข้อมูลของคุณโดยเร็ว')
        reportFiles.value.forEach(f => { if (f.preview) URL.revokeObjectURL(f.preview) })
        reportFiles.value = []
        showDriverReport.value = false
    } catch (err) {
        toast.error('เกิดข้อผิดพลาด', err.data?.message || 'ไม่สามารถส่งรายงานได้')
    } finally {
        isSubmittingReport.value = false
    }
}

async function submitPassengerReport() {
    if (isSubmittingReport.value) return
    if (!passengerReportDescription.value.trim() || passengerReportDescription.value.length < 5) {
        toast.error('กรุณากรอกรายละเอียด', 'รายละเอียดต้องมีอย่างน้อย 5 ตัวอักษร')
        return
    }
    isSubmittingReport.value = true
    try {
        const fd = new FormData()
        fd.append('type', 'PASSENGER')
        fd.append('category', passengerReportCategory.value)
        fd.append('description', passengerReportDescription.value)
        fd.append('routeId', activeTrip.value.route.id)
        fd.append('targetUserId', activeTrip.value.route.driver.id)
        reportFiles.value.forEach(f => fd.append('images', f.file))

        await $api('/reports', { method: 'POST', body: fd })
        toast.success('ส่งรายงานแล้ว', 'ทีมงานจะตรวจสอบข้อมูลของคุณโดยเร็ว')
        reportFiles.value.forEach(f => { if (f.preview) URL.revokeObjectURL(f.preview) })
        reportFiles.value = []
        showPassengerReport.value = false
    } catch (err) {
        toast.error('เกิดข้อผิดพลาด', err.data?.message || 'ไม่สามารถส่งรายงานได้')
    } finally {
        isSubmittingReport.value = false
    }
}

function closeReview() {
    isTripCompleted.value = false
    resetChat()
    const target = role.value === 'DRIVER' ? '/myRoute' : '/myTrip'
    router.push(target)
}

function openReportModal() {
    // kept for backward compat - redirects to role-aware opener
    if (role.value === 'DRIVER') openDriverReportModal()
    else openPassengerReportModal()
}

// --- Sockets ---
onEvent('booking:tripCompleted', (data) => {
    if (activeTrip.value && activeTrip.value.route.id === data.routeId) {
        isTripCompleted.value = true
        activeTrip.value.route.status = 'COMPLETED'
    }
})

onEvent('trip:started', async (data) => {
    if (activeTrip.value && activeTrip.value.route.id === data.routeId) {
        await fetchActiveTrip()
        // Bug 2 fix: reinit map after data refresh triggered by socket event
        nextTick(() => { if (mapDisplay.value && activeTrip.value) initMap() })
    }
})

onEvent('booking:passengerStatusChanged', async (data) => {
    if (activeTrip.value && activeTrip.value.route.id === data.routeId) {
        await fetchActiveTrip()
        nextTick(() => { if (mapDisplay.value && activeTrip.value) initMap() })

        // ถ้าผู้โดยสารคนนี้ถูก driver ส่งถึงที่หมายแล้ว → เปิด review modal ทันที
        // ไม่ต้องรอให้คนอื่น หรือให้ทริปทั้งหมดจบก่อน
        if (role.value === 'PASSENGER' && data.status === 'COMPLETED') {
            if (myBooking.value?.id === data.bookingId) {
                isTripCompleted.value = true
            }
        }
    }
})


onEvent('booking:created', async (data) => {
    if (activeTrip.value && activeTrip.value.route.id === data.routeId) {
        await fetchActiveTrip()
        nextTick(() => { if (mapDisplay.value && activeTrip.value) initMap() })
    }
})

onEvent('booking:cancelled', async (data) => {
    if (activeTrip.value && activeTrip.value.route.id === data.routeId) {
        await fetchActiveTrip()
        nextTick(() => { if (mapDisplay.value && activeTrip.value) initMap() })
    }
})

onEvent('booking:statusChanged', async (data) => {
    if (activeTrip.value && activeTrip.value.route.id === data.routeId) {
        await fetchActiveTrip()
        nextTick(() => { if (mapDisplay.value && activeTrip.value) initMap() })
    }
})

onEvent('booking:tripCompleted', async () => {
    isTripCompleted.value = true
    // Optionally re-fetch to get final data before it's gone
    await fetchActiveTrip()
})


// --- Passenger Kick: fired by driver when they mark passenger as no-show ---
onEvent('booking:passengerKicked', (data) => {
    // Only handle if the current user is a passenger on this trip
    if (role.value !== 'PASSENGER') return
    if (!activeTrip.value || activeTrip.value.route.id !== data.routeId) return

    toast.error('การจองถูกยกเลิก', data.message || 'คนขับไม่พบคุณ ณ จุดนัดพบ การจองของคุณถูกยกเลิก')

    // Redirect to myTrip after 2 seconds
    setTimeout(() => {
        router.push('/myTrip')
    }, 2000)
})
  
useHead({
    title: 'การเดินทางปัจจุบัน - ไปนำแหน่',
    script: process.client && !window.google?.maps ? [{
        key: 'gmaps',
        src: `https://maps.googleapis.com/maps/api/js?key=${useRuntimeConfig().public.googleMapsApiKey}&libraries=places,geometry&callback=${GMAPS_CB}`,
        async: true,
        defer: true
    }] : []
})

onMounted(async () => {
    // Bug 1 fix: reset gmap on every mount so map re-initializes after SPA navigation
    gmap = null
    mapReady.value = false

    if (window.google?.maps) {
        await fetchActiveTrip()
        nextTick(() => { if (mapDisplay.value && activeTrip.value) initMap() })
        return
    }
    window[GMAPS_CB] = async () => {
        try { delete window[GMAPS_CB] } catch {}
        await fetchActiveTrip()
        nextTick(() => { if (mapDisplay.value && activeTrip.value) initMap() })
    }
})

const mapStyles = [
  { "featureType": "administrative", "elementType": "geometry", "stylers": [{ "visibility": "off" }] },
  { "featureType": "poi", "stylers": [{ "visibility": "off" }] },
  { "featureType": "road", "elementType": "labels.icon", "stylers": [{ "visibility": "off" }] },
  { "featureType": "transit", "stylers": [{ "visibility": "off" }] }
]
</script>

<style scoped>
.font-kanit {
    font-family: 'Kanit', sans-serif;
}
</style>
