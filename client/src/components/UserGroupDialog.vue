<template>
    <q-dialog v-model="props.cards.newUser">
        <q-card style="height:70vh;">
            <q-card-section style="display:flex">
                <div class="text-h4 text-weight-bold">New Chat</div>
                <q-space />
                <q-btn flat icon="close" v-close-popup />
            </q-card-section>
            <q-card-section class="q-pt-none  full-width">
                <div style="display: grid;grid-template-columns: 1fr 1fr;gap:6px;">
                    <q-card class="my-card bg-purple text-white relative" v-for="user in userStore.notAddedUsers"
                        :key="user">
                        <q-card-section horizontal>

                            <q-card-section class="text-h4 text-weight-bold text-capitalize">
                                <q-icon name="person" size="40px"></q-icon>
                            </q-card-section>
                            <q-card-section class="text-h4 text-weight-bold text-capitalize">
                                {{ user }}
                            </q-card-section>
                        </q-card-section>

                        <q-separator />
                        <q-card-actions class=" row justify-center">
                            <q-btn color="white" @click="startChat(user)" outline label="Start Chat" />
                        </q-card-actions>
                    </q-card>
                </div>
            </q-card-section>



            <q-card-actions align="right">
            </q-card-actions>
        </q-card>
    </q-dialog>
</template>

<script setup lang="ts">
import { useUserStore } from "../store/user"
import socketManager from "../helpers/socket"
const userStore = useUserStore();
interface Cards {
    cards: {
        newUser: boolean
        newGroup: boolean
    }
}
const props = defineProps<Cards>()

const startChat = (username: string) => {
    userStore.chats.push([{
        to: username,
        from: socketManager?.connectedUser?.value.nickname,
        message: ''
    }])
    userStore.notAddedUsers.delete(username);
    userStore.activeChat = userStore.chats.length - 1;
    props.cards.newUser = false;
}
</script>



<style>
@media (min-width: 600px) {
    .q-dialog__inner--minimized>div {
        max-width: 100% !important;
    }
}
</style>
