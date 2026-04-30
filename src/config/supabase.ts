import Config from 'react-native-config';

export const SUPABASE_URL = Config.SUPABASE_URL ?? '';
export const SUPABASE_ANON_KEY = Config.SUPABASE_ANON_KEY ?? '';

export const SUPABASE_NETWORK_CONFIG = {
  headers: {
    'X-Client-Info': 'logpressai-mobile-app',
  },
  timeout: 30000,
};
