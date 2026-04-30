import Config from 'react-native-config';

export const OPENAI_CONFIG = {
  API_KEY: Config.OPENAI_API_KEY ?? '',
  API_URL: 'https://api.openai.com/v1/chat/completions',
  MODEL: 'gpt-3.5-turbo',
  MAX_TOKENS: 800,
  TEMPERATURE: 0.3,
};

export default OPENAI_CONFIG;
