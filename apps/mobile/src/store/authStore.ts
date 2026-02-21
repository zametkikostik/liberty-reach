import {create} from 'zustand';
import {MMKV} from 'react-native-mmkv';

const storage = new MMKV();

interface AuthState {
  isAuthenticated: boolean;
  user: {
    userId: string;
    displayName: string;
    phoneNumber: string;
    avatar?: string;
  } | null;
  deviceId: string;
  login: (userId: string, deviceId: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (user: Partial<AuthState['user']>) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  isAuthenticated: storage.getBoolean('isAuthenticated') ?? false,
  user: null,
  deviceId: storage.getString('deviceId') ?? '',

  login: async (userId: string, deviceId: string) => {
    storage.set('isAuthenticated', true);
    storage.set('deviceId', deviceId);
    set({
      isAuthenticated: true,
      deviceId,
      user: {
        userId,
        displayName: 'User',
        phoneNumber: '',
      },
    });
  },

  logout: async () => {
    storage.delete('isAuthenticated');
    set({
      isAuthenticated: false,
      user: null,
    });
  },

  updateUser: (user) => {
    set((state) => ({
      user: state.user ? {...state.user, ...user} : null,
    }));
  },
}));
