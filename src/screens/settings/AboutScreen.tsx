import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  Animated,
  StatusBar,
  Linking,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NavigationProps } from '../../types/navigation';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import { useTranslation } from 'react-i18next';
import { SvgXml } from 'react-native-svg';

const backIcon = `
<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M15 18L9 12L15 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
</svg>
`;

interface FAQItemProps {
  question: string;
  answer: string;
}

const FAQItem = ({ question, answer }: FAQItemProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [animation] = useState(new Animated.Value(0));
  const { colors } = useTheme();

  const toggleExpand = () => {
    const toValue = isExpanded ? 0 : 1;
    
    Animated.timing(animation, {
      toValue,
      duration: 300,
      useNativeDriver: false,
    }).start();
    
    setIsExpanded(!isExpanded);
  };

  const bodyHeight = animation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 200]
  });

  return (
    <TouchableOpacity 
      style={[
        styles.faqItem, 
        { 
          backgroundColor: colors.card,
          borderColor: isExpanded ? colors.primary : colors.cardBorder,
          shadowColor: isExpanded ? colors.primary : colors.text 
        },
        isExpanded && styles.faqItemExpanded
      ]} 
      onPress={toggleExpand}
      activeOpacity={0.9}
    >
      <View style={styles.questionContainer}>
        <Text style={[
          styles.question, 
          { color: colors.text },
          isExpanded && { color: colors.primary }
        ]}>
          {question}
        </Text>
        <Text style={[
          styles.arrow, 
          { color: colors.textSecondary },
          isExpanded && { color: colors.primary }
        ]}>
          {isExpanded ? '−' : '+'}
        </Text>
      </View>
      <Animated.View style={[
        styles.answerContainer, 
        { 
          height: bodyHeight,
          backgroundColor: colors.card,
          borderTopColor: colors.cardBorder 
        }
      ]}>
        <Text style={[styles.answer, { color: colors.textSecondary }]}>{answer}</Text>
      </Animated.View>
    </TouchableOpacity>
  );
};

const AboutScreen = () => {
  const navigation = useNavigation<NavigationProps>();
  const { colors, currentTheme } = useTheme();
  const { t } = useTranslation();
  
  // URL bağlantıları
  const privacyPolicyUrl = 'https://github.com/hasaneyldrm/PrivacyPolicy/tree/main';
  const termsOfUseUrl = 'https://github.com/hasaneyldrm/PrivacyPolicy/tree/main';
  
  // URL'yi açmak için fonksiyon
  const openURL = useCallback(async (url: string) => {
    const supported = await Linking.canOpenURL(url);
    if (supported) {
      await Linking.openURL(url);
    } else {
      console.error(`URL açılamıyor: ${url}`);
    }
  }, []);

  const faqItems = [
    {
      question: t('faq_q1'),
      answer: t('faq_a1')
    },
    {
      question: t('faq_q2'),
      answer: t('faq_a2')
    },
    {
      question: t('faq_q3'),
      answer: t('faq_a3')
    },
    {
      question: t('faq_q4'),
      answer: t('faq_a4')
    },
    {
      question: t('faq_q5'),
      answer: t('faq_a5')
    },
    {
      question: t('faq_q6'),
      answer: t('faq_a6')
    },
    {
      question: t('faq_q7'),
      answer: t('faq_a7')
    },
    {
      question: t('faq_q8'),
      answer: t('faq_a8')
    },
    {
      question: t('faq_q9'),
      answer: t('faq_a9')
    },
    {
      question: t('faq_q10'),
      answer: t('faq_a10')
    },
    {
      question: t('faq_q11'),
      answer: t('faq_a11')
    },
    {
      question: t('faq_q12'),
      answer: t('faq_a12')
    },
    {
      question: t('faq_q13'),
      answer: t('faq_a13')
    },
    {
      question: t('faq_q14'),
      answer: t('faq_a14')
    },
    {
      question: t('faq_q15'),
      answer: t('faq_a15')
    },
    {
      question: t('faq_q16'),
      answer: t('faq_a16')
    },
    {
      question: t('faq_q17'),
      answer: t('faq_a17')
    },
    {
      question: t('faq_q18'),
      answer: t('faq_a18')
    },
    {
      question: t('faq_q19'),
      answer: t('faq_a19')
    }
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar
        barStyle={currentTheme === 'dark' ? 'light-content' : 'dark-content'}
        backgroundColor={colors.headerBackground}
      />
      <View style={[styles.header, { 
        backgroundColor: colors.headerBackground,
        borderBottomColor: colors.cardBorder,
        shadowColor: colors.text 
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
        <View style={styles.headerTitleContainer}>
          <Text style={[styles.headerTitle, { color: colors.headerText }]}>{t('about_title')}</Text>
        </View>
      </View>

      <ScrollView 
        style={[styles.content, { backgroundColor: colors.surface }]} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.titleContainer}>
          <Text style={[styles.mainTitle, { color: colors.text }]}>{t('about_title')}</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            {t('about_subtitle')}
          </Text>
        </View>

        <View style={styles.faqContainer}>
          {faqItems.map((item, index) => (
            <FAQItem
              key={index}
              question={item.question}
              answer={item.answer}
            />
          ))}
        </View>
        
        {/* Yasal Bağlantılar */}
        <View style={styles.legalContainer}>
          <TouchableOpacity
            style={[styles.legalButton, { backgroundColor: colors.primary }]}
            onPress={() => openURL(privacyPolicyUrl)}
          >
            <Text style={[styles.legalButtonText, { color: colors.buttonText }]}>
              {t('settings_privacy_policy')}
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.legalButton, { backgroundColor: colors.primary }]}
            onPress={() => openURL(termsOfUseUrl)}
          >
            <Text style={[styles.legalButtonText, { color: colors.buttonText }]}>
              {t('settings_terms_of_use')}
            </Text>
          </TouchableOpacity>
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
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 3.84,
    elevation: 5,
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: 'center',
    marginRight: 40, // Geri butonunun genişliği kadar
  },
  backButton: {
    padding: 8,
    width: 40,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    fontFamily: 'Outfit',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  titleContainer: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  mainTitle: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
    fontFamily: 'Outfit',
  },
  subtitle: {
    fontSize: 15,
    marginBottom: 24,
    textAlign: 'center',
    paddingHorizontal: 20,
    fontFamily: 'Outfit',
  },
  faqContainer: {
    width: '100%',
    maxWidth: 500,
    alignSelf: 'center',
  },
  faqItem: {
    borderRadius: 16,
    marginBottom: 12,
    overflow: 'hidden',
    borderWidth: 1,
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2.22,
    elevation: 3,
  },
  faqItemExpanded: {
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  questionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  question: {
    fontSize: 16,
    fontWeight: '500',
    flex: 1,
    marginRight: 8,
    fontFamily: 'Outfit',
  },
  arrow: {
    fontSize: 20,
    fontWeight: '600',
    fontFamily: 'Outfit',
  },
  answerContainer: {
    overflow: 'hidden',
    borderTopWidth: 1,
  },
  answer: {
    fontSize: 14,
    lineHeight: 20,
    padding: 16,
    fontFamily: 'Outfit',
  },
  legalContainer: {
    marginTop: 30,
    marginBottom: 40,
    paddingHorizontal: 16,
    gap: 12,
  },
  legalButton: {
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  legalButtonText: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Outfit',
  },
});

export default AboutScreen; 