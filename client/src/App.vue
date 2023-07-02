<template>
  <div class="WAL position-relative bg-grey-4" :style="style">
    <q-layout v-if="socketManager.connectionId.value" view="lHh Lpr lFf" class="WAL__layout shadow-3" container>

      <q-header elevated>
        <q-toolbar class="bg-grey-3 text-black">
          <q-btn round flat icon="keyboard_arrow_left" class="WAL__drawer-open q-mr-sm" @click="toggleLeftDrawer" />
          <q-btn round flat>
            <q-avatar>
              <img :src="currentConversation">
            </q-avatar>
          </q-btn>

          <span class="q-subtitle-1 q-pl-md">
            {{ currentConversation }}
          </span>

          <q-space />
          <q-badge size="40px" rounded :color="socketManager.connectionId.value ? 'green' : 'yellow'" />
          <q-btn round size="8px" class="q-ml-sm" v-if="socketManager.connectionId.value" @click="disconnect"
            color="primary" icon="close" />

        </q-toolbar>
      </q-header>

      <q-drawer v-model="leftDrawerOpen" show-if-above bordered :breakpoint="690">
        <q-btn-group spread style="height:50px;" glossy>
          <q-btn @click="cards.newUser = true" size="13px" label="New Chat" icon="chat" />
          <!-- <q-btn size="13px" label="New Group" icon="groups" /> -->
        </q-btn-group>



        <q-scroll-area style="height: calc(100% - 100px)">
          <q-list bordered padding class="rounded-borders text-primary">
            <q-item @click="updateActiveUser(index)" v-for="(chat, index) in chats" :key="chat[0].to"
              :active="index == activeChat" clickable v-ripple active-class="my-menu-link">
              <q-item-section avatar>
                <q-icon name="person" size="40px" />
              </q-item-section>

              <q-item-section class=" text-weight-bold text-h5  text-capitalize">{{
                chat[0].to != socketManager.connectedUser.value.nickname ? chat[0].to : chat[0].from }}</q-item-section>
            </q-item>
          </q-list>
        </q-scroll-area>
      </q-drawer>


      <q-page-container>
        <Footer v-if="activeChat || activeChat === 0" :chat="chats[activeChat]" />
      </q-page-container>

    </q-layout>

    <UserGroupDialogVue :cards="cards" />
  </div>
</template>

<script  setup lang="ts">
import { useQuasar } from 'quasar'
import Footer from "@/components/Footer.vue"
import { ref, computed, reactive } from 'vue'
import socketManager from "./helpers/socket"
import UserGroupDialogVue from "@/components/UserGroupDialog.vue"
import { useUserStore } from "./store/user"
import { storeToRefs } from 'pinia'
const userStore = useUserStore();
const { chats, activeChat } = storeToRefs(userStore)
const q = useQuasar()
const leftDrawerOpen = ref(false)
const currentConversationIndex = ref(0)




const conversations = ref<string[]>([])
const showLoading = () => q.loading.show({
  message: 'Trying to connect.<br/><span class="text-amber text-italic">Please wait...</span>',
  html: true
})
const cards = reactive({
  newUser: false,
  newGroup: false
})





const currentConversation = computed(() => {
  return conversations.value[currentConversationIndex.value]
})

const updateActiveUser = (index: number) => {
  activeChat.value = index
}
const style = computed(() => ({
  height: q.screen.height + 'px'
}))

function toggleLeftDrawer() {
  leftDrawerOpen.value = !leftDrawerOpen.value
}



const sendUsername = async (username: string) => {
  try {
    showLoading()
    await socketManager.login(username)
    q.loading.hide()
  } catch (error) {
    q.notify({
      icon: 'contactless',
      message: 'Something went wrong,Please refresh page and try again',
      color: 'accent',
      progress: true
    })
  }

}

const showRegisterDialog = () => {
  q.loading.hide()
  q.dialog({
    title: 'Welcome!',
    message: 'Please enter your nickname ?',
    prompt: {
      model: '',
      isValid: val => val.length > 3 && val.length < 8 && !val.includes(' '),

      type: 'text' // optional,
    },
    cancel: false,
    persistent: true
  }).onOk(async (username) => {
    sendUsername(username)

  })
}
showLoading()
const username = localStorage.getItem('username');
if (username) {
  sendUsername(username)
} else {
  showRegisterDialog()
}



const disconnect = () => {
  socketManager.disconnect();
  showRegisterDialog()

}


</script>

<style lang="sass">
.my-menu-link
  color: white !important
  background: blue
.WAL
  width: 100%
  height: 100%
  padding-top: 20px
  padding-bottom: 20px

  &:before
    content: ''
    height: 127px
    position: fixed
    top: 0
    width: 100%
    background-color: #009688

  &__layout
    margin: 0 auto
    z-index: 4000
    height: 100%
    width: 90%
    max-width: 1300px
    border-radius: 5px

  &__field.q-field--outlined .q-field__control:before
    border: none

  .q-drawer--standard
    .WAL__drawer-close
      display: none

@media (max-width: 850px)
  .WAL
    padding: 0
    &__layout
      width: 100%
      border-radius: 0

@media (min-width: 691px)
  .WAL
    &__drawer-open
      display: none

.conversation__summary
  margin-top: 4px

.conversation__more
  margin-top: 0!important
  font-size: 1.4rem
</style>
