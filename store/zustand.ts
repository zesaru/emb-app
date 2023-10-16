import { create } from 'zustand'

type UserStore = {
    name: string,
    email: string,

}
export const useUserStore = create<UserStore>(() => ({
    name: '',
    email: '',
}));