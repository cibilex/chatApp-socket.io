import { defineStore } from 'pinia'

export interface Chat {
  from: string,
  to: string,
  message: string
}

export const useUserStore = defineStore('user', {
  state: () => ({
    chats: [] as Chat[][],
    notAddedUsers: new Set<string>(),
    activeChat: null as number | null
  }),
  getters: {},
  actions: {}
})
