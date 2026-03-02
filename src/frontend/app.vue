<template>
    <div>
        <NuxtLayout>
            <NuxtPage />
        </NuxtLayout>
        <ToastWrapper />
        <BubbleChat v-if="showChatBubble" />
    </div>
</template>

<script setup>
import ToastWrapper from '~/components/ToastWrapper.vue';
import BubbleChat from '~/components/BubbleChat.vue';
import { useAuth } from '~/composables/useAuth';
import { computed, onMounted } from 'vue';
import { useRoute } from 'vue-router'
import { useNotifications } from '~/composables/useNotifications'

const route = useRoute();
const { user } = useAuth();
const { init } = useNotifications();

onMounted(() => {
    init();
});

const showChatBubble = computed(() => {
    // Show if logged in AND (on current-trip page OR on admin pages)
    const isTripPage = route.path === '/current-trip';
    const isAdminPage = route.path.startsWith('/admin');
    return !!user.value && (isTripPage || isAdminPage);
});
</script>