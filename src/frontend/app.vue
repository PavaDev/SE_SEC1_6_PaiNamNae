<template>
    <div>
        <NuxtLayout>
            <NuxtPage />
        </NuxtLayout>
        <ToastWrapper />
        <DriverChat v-if="isDriver" />
    </div>
</template>

<script setup>
import ToastWrapper from '~/components/ToastWrapper.vue';
import DriverChat from '~/components/DriverChat.vue';
import { useAuth } from '~/composables/useAuth';
import { computed } from 'vue';

const { user } = useAuth();
const isDriver = computed(() => {
    // Show if logged in and role is DRIVER or for testing purposes show for all logged in users
    // For now, let's show it if the user exists to let the user see the result
    return !!user.value;
});
</script>