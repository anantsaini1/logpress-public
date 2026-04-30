import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  TextInput,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NavigationProps } from '../../types/navigation';
import { useTheme } from '../../context/ThemeContext';
import { useUser } from '../../context/UserContext';
import { storage } from '../../services/storage';
import { supabase } from '../../services/supabase';
import { SvgXml } from 'react-native-svg';
import { useTranslation } from 'react-i18next';

const backIcon = `
<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M15 18L9 12L15 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
</svg>
`;

const ReferralCodeScreen = () => {
  const navigation = useNavigation<NavigationProps>();
  const { colors, currentTheme } = useTheme();
  const { t } = useTranslation();
  const { setUserRoleId } = useUser();
  const [enterCodeText, setEnterCodeText] = useState<string>('');

  const applyReferralCode = async () => {
    const code = enterCodeText.trim().toUpperCase();
    if (!code) {
      Alert.alert(t('error'), t('referral_invalid_code'));
      return;
    }

    try {
      // Mevcut user data'yı al
      const userData = await storage.getUserData();
      const usedCodes = userData?.used_referral_codes || [];
      
      if (usedCodes.includes(code)) {
        Alert.alert(t('error'), t('referral_already_used'));
        return;
      }

      // Supabase'den kodu kontrol et
      const { data: referralCode, error: referralError } = await supabase
        .from('referral_codes')
        .select('code')
        .eq('code', code)
        .eq('is_active', true)
        .single();

      if (referralError || !referralCode) {
        Alert.alert(t('error'), t('referral_invalid_code'));
        return;
      }

      // Supabase'den RPC ile kullanım sayısını artır
      const { error: rpcError } = await supabase.rpc('increment_referral_code_usage', { p_code: code });

      if (rpcError) {
        // Hata olsa bile devam et, en kötü ihtimalle sayaç artmaz
        console.error('Referral code usage count increment error:', rpcError);
      }

      // Kod geçerliyse premium aktifleştir ve kullanılan kodu kaydet
      const newUsedCodes = [...usedCodes, code];
      
      const updatePayload = {
        used_referral_codes: newUsedCodes,
        user_role_id: 1, // Premium aktifleştir
      };
      
      await storage.updateUserData(updatePayload);
      
      // UserContext'i güncelle
      await setUserRoleId(1);
      
      setEnterCodeText('');
      
      // BMI ekranını aç
      const onboardingData = await storage.getOnboardingData() || {};
      const height = onboardingData.height || userData?.height || 175;
      const weight = onboardingData.weight || userData?.weight || 70;
      
      // BMI hesapla
      const heightInMeters = height / 100;
      const bmi = (weight / (heightInMeters * heightInMeters)).toFixed(1);
      
      // Temiz onboarding data - sadece gerekli alanlar
      const cleanOnboardingData = {
        height: Number(height),
        weight: Number(weight),
        gender: onboardingData.gender || '0',
        age: Number(onboardingData.age || 25),
        aim: onboardingData.aim || '1',
        experience: onboardingData.experience || '1',
        exercise_hours: onboardingData.exercise_hours || '1',
        referralCodeUsed: true
      };
      
      navigation.navigate('BMIScreen', {
        bmi: bmi,
        onboardingData: cleanOnboardingData
      });
      
    } catch (error) {
      console.error('Referral kod uygulanırken hata:', error);
      Alert.alert(t('error'), t('referral_invalid_code'));
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar 
        barStyle={currentTheme === 'dark' ? 'light-content' : 'dark-content'}
        backgroundColor={colors.background}
      />
      <View style={[styles.header, { 
        backgroundColor: colors.background,
        borderBottomColor: colors.cardBorder 
      }]}>
        <TouchableOpacity 
          onPress={() => navigation.goBack()} 
          style={styles.backButton}
        >
          <SvgXml 
            xml={backIcon.replace(/currentColor/g, currentTheme === 'dark' ? '#FFFFFF' : '#000000')} 
            width={24} 
            height={24} 
          />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>{t('referral_title')}</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Ana açıklama */}
        <Text style={[styles.description, { color: colors.textSecondary }]}>
          {t('referral_description')}
        </Text>

        {/* Beta Tester Notice */}
        <View style={[styles.betaSection, { backgroundColor: colors.card, borderColor: colors.primary }]}>
          <Text style={[styles.betaTitle, { color: colors.primary }]}>
            {t('referral_beta_notice')}
          </Text>
          <Text style={[styles.betaDescription, { color: colors.textSecondary }]}>
            {t('referral_beta_description')}
          </Text>
        </View>

        {/* Kod gir bölümü */}
        <View style={[styles.codeSection, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            {t('referral_enter_code')}
          </Text>
          <TextInput
            style={[styles.codeInput, { 
              backgroundColor: colors.background, 
              borderColor: colors.cardBorder,
              color: colors.text 
            }]}
            placeholder={t('referral_enter_code_placeholder')}
            placeholderTextColor={colors.textSecondary}
            value={enterCodeText}
            onChangeText={setEnterCodeText}
            autoCapitalize="characters"
            maxLength={12}
          />
          <TouchableOpacity 
            style={[styles.applyButton, { backgroundColor: colors.primary }]}
            onPress={applyReferralCode}
          >
            <Text style={styles.applyButtonText}>{t('referral_apply_code')}</Text>
          </TouchableOpacity>
        </View>

        {/* Bu nedir açıklaması */}
        <View style={[styles.infoSection, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            {t('referral_what_is_this')}
          </Text>
          <Text style={[styles.explanationText, { color: colors.textSecondary }]}>
            {t('referral_explanation')}
          </Text>
        </View>

        {/* Premium faydalar */}
        <View style={[styles.infoSection, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            {t('referral_benefits')}
          </Text>
          <Text style={[styles.benefitText, { color: colors.textSecondary }]}>
            {t('referral_benefit_1')}
          </Text>
          <Text style={[styles.benefitText, { color: colors.textSecondary }]}>
            {t('referral_benefit_2')}
          </Text>
          <Text style={[styles.benefitText, { color: colors.textSecondary }]}>
            {t('referral_benefit_3')}
          </Text>
          <Text style={[styles.benefitText, { color: colors.textSecondary }]}>
            {t('referral_benefit_4')}
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 12,
    fontFamily: 'Outfit',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 24,
    textAlign: 'center',
    fontFamily: 'Outfit',
  },
  betaSection: {
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    borderWidth: 2,
    borderStyle: 'dashed',
  },
  betaTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
    textAlign: 'center',
    fontFamily: 'Outfit',
  },
  betaDescription: {
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
    fontFamily: 'Outfit',
  },
  codeSection: {
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
  },
  infoSection: {
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
    fontFamily: 'Outfit',
  },

  codeInput: {
    borderRadius: 8,
    padding: 16,
    borderWidth: 1,
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 16,
    fontWeight: '600',
    textTransform: 'uppercase',
    fontFamily: 'Outfit',
  },
  applyButton: {
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  applyButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Outfit',
  },
  explanationText: {
    fontSize: 16,
    lineHeight: 24,
    fontFamily: 'Outfit',
  },
  benefitText: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 8,
    fontFamily: 'Outfit',
  },
});

export default ReferralCodeScreen; 