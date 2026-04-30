import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  TextInput,
  Alert,
  useWindowDimensions,
  StatusBar,
  Keyboard,
  TouchableWithoutFeedback,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NavigationProps } from '../../../types/navigation';
import { storage } from '../../../services/storage';
import { useTheme } from '../../../context/ThemeContext';
import { useLanguage } from '../../../context/LanguageContext';
import { useTranslation } from 'react-i18next';

const NameScreen = () => {
  const navigation = useNavigation<NavigationProps>();
  const { colors } = useTheme();
  const { t } = useTranslation();
  const { width, height } = useWindowDimensions();
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const textInputRef = useRef<TextInput>(null);

  // Responsive değerler
  const isTablet = width >= 768;
  const titleFontSize = isTablet ? 48 : (width < 380 ? 32 : 40);
  const subtitleFontSize = isTablet ? 20 : (width < 380 ? 15 : 17);
  const topPadding = height < 700 ? 10 : 20;

  const styles = StyleSheet.create({
    container: {
      flex: 1,
    },
    keyboardAvoidingView: {
      flex: 1,
    },
    scrollView: {
      flex: 1,
    },
    scrollContent: {
      flexGrow: 1,
    },
    header: {
      paddingHorizontal: 20,
      paddingTop: 10,
    },
    backButton: {
      fontSize: 24,
      fontFamily: 'Outfit',
      fontWeight: '400',
    },
    content: {
      flex: 1,
      alignItems: 'center',
      padding: 16,
      paddingHorizontal: width < 380 ? 12 : 16,
      justifyContent: 'space-between',
    },
    topSection: {
      width: '100%',
      alignItems: 'center',
    },
    titleContainer: {
      width: '100%',
      alignItems: 'center',
      marginBottom: height < 700 ? 20 : 40,
    },
    title: {
      fontFamily: 'Outfit',
      fontWeight: '900',
      textAlign: 'center',
      marginBottom: 8,
      letterSpacing: -1,
    },
    subtitle: {
      fontFamily: 'Outfit',
      textAlign: 'center',
      lineHeight: 24,
    },
    inputContainer: {
      width: '100%',
      marginBottom: height < 700 ? 20 : 40,
    },
    textInput: {
      width: '100%',
      height: height < 700 ? 48 : 56,
      borderWidth: 2,
      borderRadius: 12,
      paddingHorizontal: 16,
      fontSize: width < 380 ? 16 : 18,
      fontFamily: 'Outfit',
      fontWeight: '500',
      textAlign: 'center',
    },
    errorText: {
      color: colors.error || '#FF6B6B',
      fontSize: 14,
      fontFamily: 'Outfit',
      fontWeight: '500',
      textAlign: 'center',
      marginTop: 8,
    },
    continueButton: {
      width: '100%',
      height: height < 700 ? 48 : 56,
      borderRadius: 12,
      justifyContent: 'center',
      alignItems: 'center',
      marginTop: 20,
      marginBottom: Platform.OS === 'ios' ? 20 : 10,
    },
    continueButtonText: {
      fontSize: width < 380 ? 16 : 18,
      fontFamily: 'Outfit',
      fontWeight: '600',
    },
    disabledButton: {
      opacity: 0.5,
    },
  });

  // Screen'e gelindiğinde klavyeyi otomatik aç
  useFocusEffect(
    React.useCallback(() => {
      // Kısa bir gecikme ile focus yap (animasyon tamamlansın diye)
      const timer = setTimeout(() => {
        textInputRef.current?.focus();
      }, 100);

      return () => clearTimeout(timer);
    }, [])
  );

  const validateName = (inputName: string): string => {
    const trimmedName = inputName.trim();
    
    if (!trimmedName) {
      return t('name_screen_validation_error');
    }
    
    if (trimmedName.length < 2) {
      return t('name_screen_min_length_error');
    }
    
    if (trimmedName.length > 30) {
      return t('name_screen_max_length_error');
    }
    
    // Sadece harf, boşluk ve bazı özel karakterlere izin ver
    const nameRegex = /^[a-zA-ZğüşıöçĞÜŞİÖÇ\s'-]+$/;
    if (!nameRegex.test(trimmedName)) {
      return t('name_screen_validation_error');
    }
    
    return '';
  };

  const handleNameChange = (text: string) => {
    setName(text);
    if (error) {
      setError('');
    }
  };

  const handleContinue = async () => {
    const trimmedName = name.trim();
    const validationError = validateName(trimmedName);
    
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsLoading(true);
    
    try {
      // Mevcut user data'yı al veya yeni oluştur
      const existingUserData = await storage.getUserData() || {};
      
      const updatedData = {
        ...existingUserData,
        display_name: trimmedName,
        name: trimmedName, // Hem display_name hem de name alanını güncelle
        updated_at: new Date().toISOString()
      };

      const savedData = await storage.setUserData(updatedData);

      if (!savedData) {
        throw new Error('Veriler kaydedilemedi');
      }

      // BMI hesapla (final user data için)
      const weight = updatedData.weight;
      const height = updatedData.height;
      if (weight && height) {
        const heightInMeters = height / 100;
        const bmiValue = weight / (heightInMeters * heightInMeters);
        
        // BMI kategorisini belirle
        let bmiCategory = '';
        if (bmiValue < 18.5) {
          bmiCategory = 'underweight';
        } else if (bmiValue >= 18.5 && bmiValue < 25) {
          bmiCategory = 'normal';  
        } else if (bmiValue >= 25 && bmiValue < 30) {
          bmiCategory = 'overweight';
        } else {
          bmiCategory = 'obese';
        }

        // Final user data'yı oluştur
        const finalUserData = {
          ...updatedData,
          bmi: bmiValue,
          bmi_category: bmiCategory,
          updated_at: new Date().toISOString()
        };

        // Final verileri kaydet
        await storage.updateUserData({
          bmi: bmiValue,
          bmi_category: bmiCategory,
          updated_at: new Date().toISOString()
        });

        // Background'da user registration yap
        // registerUserInBackground(finalUserData, bmiValue, bmiInfo);

        // Motivational Loading Screen'e git
        (navigation as any).navigate('MotivationalLoadingScreen');
        
      } else {
        console.error('NameScreen: Weight or height missing for BMI calculation');
        Alert.alert(
          t('error'),
          t('bmi_calculation_error'),
          [{ text: t('ok'), onPress: () => navigation.goBack() }]
        );
      }
    } catch (error: any) {
      Alert.alert(
        t('error'),
        t('data_save_error'),
        [{ text: t('ok'), onPress: () => {} }]
      );
    } finally {
      setIsLoading(false);
    }
  };

  const dismissKeyboard = () => {
    Keyboard.dismiss();
  };

  const isButtonDisabled = !name.trim() || isLoading;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
      
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Text style={[styles.backButton, { color: colors.text }]}>{'←'}</Text>
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <TouchableWithoutFeedback onPress={dismissKeyboard}>
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.content}>
              <View style={styles.topSection}>
                <View style={[styles.titleContainer, { paddingTop: topPadding }]}>
                  <Text style={[styles.title, {
                    color: colors.text,
                    fontSize: titleFontSize
                  }]}>
                    {t('name_screen_title')}
                  </Text>
                  <Text style={[styles.subtitle, {
                    color: colors.textSecondary,
                    fontSize: subtitleFontSize
                  }]}>
                    {t('name_screen_subtitle')}
                  </Text>
                </View>

                <View style={styles.inputContainer}>
                  <TextInput
                    ref={textInputRef}
                    style={[
                      styles.textInput,
                      {
                        backgroundColor: colors.background,
                        borderColor: error ? (colors.error || '#FF6B6B') : colors.border,
                        color: colors.text,
                      }
                    ]}
                    value={name}
                    onChangeText={handleNameChange}
                    placeholder={t('name_screen_placeholder')}
                    placeholderTextColor={colors.textSecondary}
                    maxLength={30}
                    autoCapitalize="words"
                    autoCorrect={false}
                    autoFocus={true}
                    returnKeyType="done"
                    onSubmitEditing={handleContinue}
                    editable={!isLoading}
                    keyboardType="default"
                    textContentType="name"
                  />
                  {error ? (
                    <Text style={styles.errorText}>{error}</Text>
                  ) : null}
                </View>
              </View>

              <TouchableOpacity
                style={[
                  styles.continueButton,
                  {
                    backgroundColor: colors.primary,
                  },
                  isButtonDisabled && styles.disabledButton
                ]}
                onPress={handleContinue}
                disabled={isButtonDisabled}
              >
                <Text style={[styles.continueButtonText, { color: colors.buttonText }]}>
                  {isLoading ? '...' : t('continue_button')}
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default NameScreen;