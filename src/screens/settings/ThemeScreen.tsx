import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Dimensions,
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

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH - 32;

const SystemPreview = () => {
  const screenWidth = Dimensions.get('window').width;
  const iconSize = screenWidth * 0.08; // Responsive icon size
  const phoneWidth = screenWidth * 0.6; // Responsive phone width

  return (
    <View style={styles.systemPreview}>
      <View style={styles.systemIconContainer}>
        <View style={[styles.systemIcon, { width: iconSize, height: iconSize }]}>
          <View style={[styles.sunRays, { width: iconSize, height: iconSize }]}>
            {[...Array(8)].map((_, i) => (
              <View
                key={i}
                style={[
                  styles.ray,
                  { 
                    transform: [{ rotate: `${i * 45}deg` }],
                    height: iconSize * 0.3,
                    width: 2 
                  }
                ]}
              />
            ))}
          </View>
          <View style={[styles.sunCenter, { 
            width: iconSize * 0.5, 
            height: iconSize * 0.5,
            borderRadius: iconSize * 0.25,
            marginTop: -iconSize * 0.25,
            marginLeft: -iconSize * 0.25
          }]} />
        </View>
        <View style={[styles.systemArrows, { marginHorizontal: iconSize * 0.5 }]}>
          <View style={styles.arrowContainer}>
            <View style={[styles.arrow, styles.leftArrow]} />
            <View style={[styles.arrow, styles.rightArrow]} />
          </View>
        </View>
        <View style={[styles.moonIcon, { width: iconSize, height: iconSize }]}>
          <View style={[styles.moonBody, {
            width: iconSize * 0.6,
            height: iconSize * 0.6,
            borderRadius: iconSize * 0.3
          }]}>
            <View style={[styles.moonShade, {
              width: iconSize * 0.5,
              height: iconSize * 0.5,
              borderRadius: iconSize * 0.25
            }]} />
          </View>
        </View>
      </View>

      <View style={[styles.phoneContainer, { width: phoneWidth }]}>
        <View style={styles.phoneDayNight}>
          <View style={styles.phoneLight}>
            <View style={styles.phoneHeader}>
              <View style={styles.phoneStatusBar} />
              <View style={styles.phoneContent}>
                <View style={styles.phoneBox} />
                <View style={[styles.phoneBox, { width: '70%' }]} />
              </View>
            </View>
          </View>
          <View style={styles.phoneDark}>
            <View style={[styles.phoneHeader, styles.phoneDarkHeader]}>
              <View style={[styles.phoneStatusBar, styles.phoneDarkElements]} />
              <View style={styles.phoneContent}>
                <View style={[styles.phoneBox, styles.phoneDarkElements]} />
                <View style={[styles.phoneBox, styles.phoneDarkElements, { width: '70%' }]} />
              </View>
            </View>
          </View>
        </View>
        <View style={styles.systemLabel}>
          <Text style={styles.systemLabelText}>{useLanguage().t('theme_auto_change')}</Text>
        </View>
      </View>
    </View>
  );
};

const ThemeOption = ({ title, subtitle, isSelected, onSelect, isDark, isSystem }: { 
  title: string;
  subtitle: string;
  isSelected: boolean; 
  onSelect: () => void;
  isDark?: boolean;
  isSystem?: boolean;
}) => (
  <TouchableOpacity 
    style={[
      styles.themeOption, 
      isSelected && styles.selectedTheme,
      isDark && styles.darkThemeCard,
    ]} 
    onPress={onSelect}
  >
    <View style={styles.themePreview}>
      {isSystem ? (
        <SystemPreview />
      ) : (
        // Normal tema önizlemesi
        <View style={[styles.normalPreview, isDark && styles.darkThemePreview]}>
          <View style={[styles.previewHeader, isDark && styles.darkPreviewHeader]}>
            <View style={[styles.previewStatusBar, isDark && styles.darkPreviewStatusBar]} />
            <View style={styles.previewContent}>
              <View style={[styles.previewCircle, isDark && styles.darkPreviewCircle]} />
              <View style={[styles.previewLine, isDark && styles.darkPreviewLine]} />
            </View>
          </View>
          <View style={[styles.previewBody, isDark && styles.darkPreviewBody]}>
            <View style={[styles.previewBox, isDark && styles.darkPreviewBox]} />
            <View style={[styles.previewBox, isDark && styles.darkPreviewBox, { width: '70%' }]} />
          </View>
        </View>
      )}
    </View>
    <View style={styles.optionContent}>
      <View style={styles.textContainer}>
        <Text style={[
          styles.themeTitle, 
          isSelected && styles.selectedThemeText,
          isDark && styles.darkThemeText
        ]}>{title}</Text>
        <Text style={[
          styles.themeSubtitle,
          isDark && styles.darkThemeText
        ]}>{subtitle}</Text>
      </View>
      {isSelected && (
        <View style={styles.checkmarkContainer}>
          <Text style={styles.checkmark}>✓</Text>
        </View>
      )}
    </View>
  </TouchableOpacity>
);

const ThemeScreen = () => {
  const navigation = useNavigation<NavigationProps>();
  const { theme, setTheme, colors, currentTheme } = useTheme();
  const { t } = useTranslation();

  const themes = [
    { 
      id: 'system', 
      title: t('theme_system'),
      subtitle: t('theme_system_subtitle'),
      isSystem: true
    },
    { 
      id: 'dark', 
      title: t('theme_dark'),
      subtitle: t('theme_dark_subtitle'),
      isDark: true
    },
    { 
      id: 'light', 
      title: t('theme_light'),
      subtitle: t('theme_light_subtitle')
    },
  ];

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
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <SvgXml 
            xml={backIcon.replace(/currentColor/g, currentTheme === 'dark' ? '#FFFFFF' : '#000000')} 
            width={24} 
            height={24} 
          />
        </TouchableOpacity>
        <View style={styles.titleContainer}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>{t('theme_title')}</Text>
        </View>
        <View style={styles.backButton} />
      </View>

      <ScrollView style={[styles.content, { backgroundColor: colors.background }]} showsVerticalScrollIndicator={false}>
        <Text style={[styles.description, { color: colors.textSecondary }]}>
          {t('theme_description')}
        </Text>
        
        <View style={styles.themeList}>
          {themes.map((item) => (
            <ThemeOption
              key={item.id}
              title={item.title}
              subtitle={item.subtitle}
              isSelected={theme === item.id}
              onSelect={() => setTheme(item.id as 'system' | 'light' | 'dark')}
              isDark={item.isDark}
              isSystem={item.isSystem}
            />
          ))}
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
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    height: 56,
    borderBottomWidth: 1,
    zIndex: 1,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  titleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    textAlign: 'center',
    fontFamily: 'Outfit',
  },
  content: {
    flex: 1,
  },
  description: {
    fontSize: 15,
    padding: 16,
    lineHeight: 22,
    marginBottom: 8,
    fontFamily: 'Outfit',
  },
  themeList: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  themeOption: {
    width: CARD_WIDTH,
    marginBottom: 20,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
    overflow: 'hidden',
  },
  darkThemeCard: {
    backgroundColor: '#1F2937',
  },
  themePreview: {
    width: '100%',
    height: 160,
    overflow: 'hidden',
  },
  normalPreview: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  darkThemePreview: {
    backgroundColor: '#1F2937',
  },
  systemPreview: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    alignItems: 'center',
    justifyContent: 'space-around',
    padding: 16,
  },
  systemIconContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  systemIcon: {
    width: 40,
    height: 40,
    position: 'relative',
    marginRight: 24,
  },
  sunRays: {
    width: 40,
    height: 40,
    position: 'absolute',
  },
  ray: {
    position: 'absolute',
    width: 2,
    height: 12,
    backgroundColor: '#FCD34D',
    left: '50%',
    top: -2,
    marginLeft: -1,
  },
  sunCenter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#FBBF24',
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginTop: -10,
    marginLeft: -10,
  },
  moonIcon: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  moonBody: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#6B7280',
    position: 'relative',
    overflow: 'hidden',
  },
  moonShade: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#F9FAFB',
    top: -4,
    right: -4,
  },
  systemArrows: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  arrowContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E5E7EB',
    padding: 8,
    borderRadius: 12,
  },
  arrow: {
    width: 16,
    height: 2,
    backgroundColor: '#6B7280',
    margin: 4,
  },
  leftArrow: {
    transform: [{ rotate: '180deg' }],
  },
  rightArrow: {
    transform: [{ rotate: '0deg' }],
  },
  phoneContainer: {
    backgroundColor: '#E5E7EB',
    borderRadius: 16,
    padding: 12,
    width: '100%',
  },
  phoneDayNight: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  phoneLight: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 8,
    marginRight: 6,
  },
  phoneDark: {
    flex: 1,
    backgroundColor: '#1F2937',
    borderRadius: 8,
    padding: 8,
    marginLeft: 6,
  },
  phoneHeader: {
    backgroundColor: '#FFFFFF',
    borderRadius: 6,
    padding: 8,
  },
  phoneDarkHeader: {
    backgroundColor: '#111827',
  },
  phoneDarkElements: {
    backgroundColor: '#374151',
  },
  phoneStatusBar: {
    height: 4,
    backgroundColor: '#D1D5DB',
    width: '40%',
    borderRadius: 2,
    marginBottom: 6,
  },
  phoneContent: {
    flex: 1,
    justifyContent: 'center',
  },
  phoneBox: {
    height: 6,
    backgroundColor: '#D1D5DB',
    borderRadius: 3,
    marginBottom: 4,
  },
  previewHeader: {
    height: 60,
    backgroundColor: '#FFFFFF',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  lightPreviewHeader: {
    backgroundColor: '#FFFFFF',
  },
  darkPreviewHeader: {
    backgroundColor: '#111827',
    borderBottomColor: '#374151',
  },
  previewStatusBar: {
    height: 6,
    backgroundColor: '#E5E7EB',
    marginBottom: 8,
    borderRadius: 3,
    width: '60%',
  },
  darkPreviewStatusBar: {
    backgroundColor: '#374151',
  },
  previewContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  previewCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#E5E7EB',
    marginRight: 8,
  },
  darkPreviewCircle: {
    backgroundColor: '#374151',
  },
  previewLine: {
    height: 6,
    backgroundColor: '#E5E7EB',
    borderRadius: 3,
    flex: 1,
  },
  darkPreviewLine: {
    backgroundColor: '#374151',
  },
  previewBody: {
    padding: 12,
    backgroundColor: '#F9FAFB',
    flex: 1,
  },
  darkPreviewBody: {
    backgroundColor: '#1F2937',
  },
  previewBox: {
    height: 24,
    backgroundColor: '#E5E7EB',
    borderRadius: 6,
    marginBottom: 8,
  },
  darkPreviewBox: {
    backgroundColor: '#374151',
  },
  optionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  textContainer: {
    flex: 1,
  },
  themeTitle: {
    fontSize: 18,
    color: '#111827',
    fontWeight: '600',
    marginBottom: 4,
    fontFamily: 'Outfit',
  },
  themeSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    fontFamily: 'Outfit',
  },
  darkThemeText: {
    color: '#FFFFFF',
  },
  selectedTheme: {
    borderWidth: 2,
    borderColor: '#E11D48',
  },
  selectedThemeText: {
    color: '#E11D48',
  },
  checkmarkContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#E11D48',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },
  checkmark: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '600',
    fontFamily: 'Outfit',
  },
  systemLabel: {
    alignItems: 'center',
    marginTop: 8,
  },
  systemLabelText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
    fontFamily: 'Outfit',
  },
});

export default ThemeScreen; 