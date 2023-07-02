<template>
    <q-page class="column   justify-end bg-grey-3">
        <div class="col-grow overflow-scroll" style="padding-top:58px;display: flex;flex-direction: column-reverse;">

            <transition-group name="list">
                <div v-for="(message, index) in formatedMessages" :key="message.message">
                    <template v-if="message.message">
                        <template v-if="message.from == socketManager.connectedUser.value.nickname">
                            <q-chat-message class="q-mx-md" :text="message.list" sent text-color="white" bg-color="primary">
                            </q-chat-message>
                            <q-chat-message v-if="typings.to && !index" class="q-mx-xl" bg-color="amber">
                                <q-spinner-dots size="2rem" />
                            </q-chat-message>
                        </template>

                        <q-chat-message v-else class="q-mx-xl" bg-color="amber">
                            <div v-for="(item) in message.list" :key="item">
                                {{ item }}
                            </div>
                            <q-spinner-dots v-if="!index && typings.to" size="2rem" />
                        </q-chat-message>

                    </template>
                </div>
            </transition-group>
        </div>
        <q-toolbar class="bg-grey-3 text-black row" style="flex-shrink: 0;">
            <q-btn round flat icon="insert_emoticon" class="q-mr-sm" />
            <q-input  rounded outlined @blur="updateTyping(false)" @focus="updateTyping(true)" dense
                class="WAL__field col-grow q-mr-sm" bg-color="white" v-model="message" placeholder="Type a message" />
            <q-btn :loading="loadings.message" round flat :disable="loadings.message || message.length == 0"
                @click="sendMessage" icon="send" />
        </q-toolbar>
    </q-page>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from "vue"
import socketManager from "../helpers/socket";
import { useQuasar } from 'quasar'
import { Chat, useUserStore } from "../store/user.js";

const loadings = reactive({
    message: false,
    typing: false
})
const message = ref('')
const props = defineProps<{
    chat: Chat[]
}>()

interface GroupedChat extends Chat {
    list: string[]
}
const $q = useQuasar()
const typings = reactive({
    from: false,
    to: false
})
const userStore = useUserStore();
const formatedMessages = computed(() => props.chat.reduce((prev, curr) => {
    if (prev.at(-1)?.from == curr.from) {
        prev.at(-1)?.list.push(curr.message)
    } else {
        prev.push({
            from: curr.from,
            to: curr.to,
            message: curr.message,
            list: [curr.message]
        })
    }
    return prev
}, [] as GroupedChat[]).reverse())
const sendMessage = async () => {
    loadings.message = true;
    try {
        await socketManager.sendMessage(message.value)
        message.value = '';
        $q.notify('Message successfully sent')
    } catch (error) {
        console.log(error);
    }
    loadings.message = false;
}


const updateTyping = (target: boolean) => {
    if (loadings.typing || (props.chat.length == 1 && !props.chat[0].message)) return;

    setTimeout(async () => {
        const cond = props.chat[0].from == socketManager.connectedUser.value.nickname ? props.chat[0].to : props.chat[0].from
        const res = await socketManager.toggleTyping(target, cond);
        typings.from = res
    }, 10)
}

onMounted(() => {
    socketManager.socket.on('toggleTyping', (username: string, target: boolean) => {
        const cond = props.chat[0].from == username || props.chat[0].to == username || props.chat[0]
        if (cond) {
            typings.to = target
        }
    })
})


</script>


<style>
.list-move,
/* apply transition to moving elements */
.list-enter-active,
.list-leave-active {
    transition: all 0.5s ease;
}

.list-enter-from,
.list-leave-to {
    opacity: 0;
    transform: translateX(30px);
}

/* ensure leaving items are taken out of layout flow so that moving
   animations can be calculated correctly. */
.list-leave-active {
    position: absolute;
}
</style>
