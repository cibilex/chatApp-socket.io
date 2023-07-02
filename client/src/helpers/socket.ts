import io, { Server } from 'socket.io-client'
import { Chat, useUserStore } from '../store/user'

import { reactive, ref } from "vue"

class SocketManger {
  static instance: SocketManger


  constructor() {
    if (SocketManger.instance) {
      return SocketManger.instance
    }
    this.socket = io("http://127.0.0.1:8080", {
      autoConnect: false,
      auth: (cb) => {
        cb({
          token: localStorage.getItem('username')
        });
      }
    })
    this.connectionId = ref(null);
    this.connectedUser = ref({
      nickname: ''
    })
    this.socket.on('connect', () => {
      this.connectionId.value = this.socket.id;
    })

    this.socket.on('newUser', username => {
      const userStore = useUserStore();

      userStore.notAddedUsers.add(username)
    })

    this.socket.on('newMessage', (chat: Chat) => {
      const userStore = useUserStore();
      const target = chat.from == this.connectedUser.value.nickname ? chat.to : chat.from
      const currentChat = userStore.chats.find(cell => cell[0].from == target || cell[0].to == target);
      if (currentChat) {
        currentChat.push(chat)
      } else {
        userStore.chats.push([chat])
        userStore.activeChat = userStore.chats.length - 1
      }
    })




    this.socket.on('disconnect', (reason: string) => {
      // localStorage.removeItem("username");
      this.connectedUser.value.nickname = ''
      this.connectionId.value = null;
      console.log('connection disconnected with reason:', reason)
    });
    this.socket.on('connect_error', error => console.log('middleware fired error which is:', error))
    this.socket.io.on('ping', () => console.log('ping message has been received '))
    SocketManger.instance = this
  }
  async connect() {
    if (this.socket) {
      await this.socket.disconnect()
    }
    await this.socket.connect();
  }

  async sendMessage(message: string) {
    const userStore = useUserStore();
    const chat = userStore.chats[userStore.activeChat || 0]
    const targetUser = chat[0].from == this.connectedUser.value.nickname ? chat[0].to : chat[0].from

    const res = await this.socket.timeout(5000).emitWithAck('sendMessage', targetUser, message);
    if (!res) throw new Error("Something went wrong");
    if (chat[0].message) {
      chat.push(res)
    } else {
      chat[0] = res
    }
  }

  async login(username: string) {
    localStorage.setItem('username', username)
    await this.connect();
    const res = await this.socket.timeout(5000).emitWithAck('login', username);
    if (!res) throw new Error("Something went wrong");
    const { users, chats } = res;
    const userStore = useUserStore();
    this.connectedUser.value.nickname = username
    for (const user of users) {
      userStore.notAddedUsers.add(user)

    }


    if (chats.length > 0) {
      userStore.chats = chats;
      userStore.activeChat = 0;
    }
    if (res.chats.length > 0) {
    }
    return true
  }

  async toggleTyping(status: boolean, username: string) {
    try {
      const res = await this.socket.timeout(5000).emitWithAck('toggleTyping', username, status)
      return res
    } catch (err) {
      console.log(err)
      return false
    }
  }



  async disconnect() {
    if (this.socket?.id) {
      const userStore = useUserStore();
      userStore.chats = [];
      userStore.activeChat = null;
      userStore.notAddedUsers = new Set()
      localStorage.removeItem('username');
      this.socket.disconnect();

    }
  }


}

const socketManager = new SocketManger();

export default socketManager;