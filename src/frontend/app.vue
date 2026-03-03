<template>
    <div>
        <NuxtLayout>
            <NuxtPage />
        </NuxtLayout>
        <ToastWrapper />
<<<<<<< Updated upstream
=======
        <!-- <NotiChat v-if="showChatBubble" /> -->
>>>>>>> Stashed changes
    </div>
</template>

<script setup>
import ToastWrapper from '~/components/ToastWrapper.vue';
<<<<<<< Updated upstream
=======
// import NotiChat from '~/components/NotiChat.vue';
import { useAuth } from '~/composables/useAuth';
import { computed, onMounted } from 'vue';
import { useRoute } from 'vue-router'
// import { useNotifications } from '~/composables/useNotifications'

const route = useRoute();
const { user } = useAuth();
// const { init, notifications, hasUnread } = useNotifications();

// watch(user, (val) => {
//     if (val) init();
// }, { immediate: true });

// const showChatBubble = computed(() => {
//     if (!user.value) return false;
//     
//     const isTripPage = route.path === '/current-trip';
//     const isAdminPage = route.path.startsWith('/admin');
//     
//     // Show if on specific pages OR if there is unread info/active notifications
//     // This makes the bubble "pop up" when a new notification arrives
//     return isTripPage || isAdminPage || (hasUnread.value && notifications.value.length > 0);
// });
>>>>>>> Stashed changes
</script>