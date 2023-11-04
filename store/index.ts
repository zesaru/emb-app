import { type StateCreator, create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { customSessionStorage } from './custom.storage';

interface PersonState {
  userName: string;
}

interface Actions {
  setUserName: ( value: string ) => void;
}

const storeAPi: StateCreator<PersonState & Actions, [ [ "zustand/devtools", never ] ]> = ( set ) => ( {

  userName: 'Cesar Murillo',

  setUserName: ( value: string ) => set( ( { userName: value } ), false, 'setUserName' ),

} );

export const usePersonStore = create<PersonState & Actions>()(
  devtools(
    persist(
      storeAPi
      , {
        name: 'person-storage',
        storage: customSessionStorage,
      } )
  )
);