/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import React, { useEffect } from 'react';
import { Provider, useDispatch } from 'react-redux';
import { NavigationContainer } from '@react-navigation/native';
import Toast, {
  BaseToast,
  ErrorToast,
  BaseToastProps,
} from 'react-native-toast-message';
import { store } from './src/store';
import { ThemeProvider, useTheme } from './src/context/ThemeContext';
import { LanguageProvider } from './src/context/LanguageContext';
import { UserProvider } from './src/context/UserContext';
import { RootNavigator } from './src/navigation';
import { adaptyService } from './src/services/adapty';
import { ADAPTY_CONFIG } from './src/config/adapty';
import { loadWorkoutsFromStorage } from './src/store/slices/workoutSlice';
import { loadUserFromStorage } from './src/store/slices/userSlice';
import './src/i18n';
import { I18nextProvider } from 'react-i18next';
import i18n from './src/i18n';

// App initializer component that loads data into Redux
const AppInitializer: React.FC = () => {
  const dispatch = useDispatch();
  const { colors } = useTheme();

  // Theme'e göre dinamik toast config
  const toastConfig = {
    success: (props: BaseToastProps) => (
      <BaseToast
        {...props}
        style={{ 
          borderLeftColor: colors.success,
          backgroundColor: colors.card,
          borderColor: colors.border,
          borderWidth: 1,
        }}
        text1Style={{
          fontSize: 16,
          color: colors.text,
          fontWeight: '600',
        }}
        text2Style={{
          fontSize: 14,
          color: colors.textSecondary,
        }}
      />
    ),
    error: (props: BaseToastProps) => (
      <ErrorToast
        {...props}
        style={{ 
          borderLeftColor: colors.error,
          backgroundColor: colors.card,
          borderColor: colors.border,
          borderWidth: 1,
        }}
        text1Style={{
          fontSize: 16,
          color: colors.text,
          fontWeight: '600',
        }}
        text2Style={{
          fontSize: 14,
          color: colors.textSecondary,
        }}
      />
    ),
    info: (props: BaseToastProps) => (
      <BaseToast
        {...props}
        style={{ 
          borderLeftColor: colors.primary,
          backgroundColor: colors.card,
          borderColor: colors.border,
          borderWidth: 1,
        }}
        text1Style={{
          fontSize: 16,
          color: colors.text,
          fontWeight: '600',
        }}
        text2Style={{
          fontSize: 14,
          color: colors.textSecondary,
        }}
      />
    ),
  };

  useEffect(() => {
    const initializeApp = async () => {
      try {

        
        // ÖNCELİK 1: Navigation için kritik olan işlemler (blocking olmayan)
        const criticalPromises = [
          // User data hemen yükle (navigation karar vermesi için)
          (async () => {
            try {
              await dispatch(loadUserFromStorage() as any);
            } catch (error) {

            }
          })(),

          // Workoutları yükle (kritik değil ama hızlı)
          (async () => {
            try {
              await dispatch(loadWorkoutsFromStorage() as any);
            } catch (error) {

            }
          })(),
        ];

        // Kritik işlemleri bekle
        await Promise.all(criticalPromises);
        
        // ÖNCELİK 2: Adapty SDK - arka planda başlat (non-blocking)
        // Navigation'ı bloke etmesin diye timeout'u kısalttık
        setTimeout(async () => {
          try {

            
            // Daha kısa timeout ile başlat
            const adaptyPromise = adaptyService.initialize(ADAPTY_CONFIG.API_KEY);
            const timeoutPromise = new Promise((_, reject) => 
              setTimeout(() => reject(new Error('Adapty timeout')), 5000)
            );
            
            await Promise.race([adaptyPromise, timeoutPromise]);
            
            // Başarılı başlangıç sonrası refund kontrolü
            await adaptyService.checkAndHandleRefund();
            
          } catch (error) {
            // Adapty hatası uygulamayı bloke etmemeli
          }
        }, 100); // Navigation başladıktan hemen sonra başlat
        

      } catch (error) {

        // Hata olsa bile navigation devam etmeli
      }
    };

    initializeApp();
  }, [dispatch]);

  return (
    <LanguageProvider>
      <UserProvider>
        <NavigationContainer>
          <RootNavigator />
          <Toast config={toastConfig} topOffset={80} />
        </NavigationContainer>
      </UserProvider>
    </LanguageProvider>
  );
};

function App(): React.JSX.Element {
  return (
    <Provider store={store}>
      <ThemeProvider>
        <I18nextProvider i18n={i18n}>
          <AppInitializer />
        </I18nextProvider>
      </ThemeProvider>
    </Provider>
  );
}

export default App;
