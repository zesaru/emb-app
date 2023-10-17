import { create } from 'zustand'

type UserStore = {
    name: string,

}
export const useUserStore = create<UserStore>((set) => ({
    name: '',
}));