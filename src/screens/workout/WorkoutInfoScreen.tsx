import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Platform,
  Image,
  ActivityIndicator,

  useColorScheme
} from 'react-native';
import Video from 'react-native-video';
import { NavigationProps } from '../../types/navigation';

import { supabase } from '../../services/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../../context/ThemeContext';
import { useTranslation } from 'react-i18next';


const { width: SCREEN_WIDTH } = Dimensions.get('window');
const scale = SCREEN_WIDTH / 375;
const normalize = (size: number) => size * scale;

interface ProductDetail {
  content?: {
    title1?: string;
    description1?: string;
    title2?: string;
    description2?: string;
    title3?: string;
    description3?: string;
    title4?: string;
    description4?: string;
    title5?: string;
    description5?: string;
  };
  externalLink?: string;
  videoType?: 'gif' | 'mp4';
  image?: string;
  mainCategory?: string;
  name?: string;
  subCategories?: string;
  lastExercise?: any[];
  recommendedSet?: string;
  recommendedRepeat?: string;
  recommendedAwaitTime?: string;
}

interface WorkoutInfoScreenProps {
  navigation: NavigationProps;
  route: {
    params: {
      exercise: {
        id: number;
        name: string;
        target: string;
        image?: string;
        equipment: string;
      };
    };
  };
}

const WorkoutInfoScreen: React.FC<WorkoutInfoScreenProps> = ({ route, navigation }: WorkoutInfoScreenProps) => {
  const { exercise } = route.params;
  const [, ] = useState<'overview' | 'howto'>('overview');
  const [productDetail, setProductDetail] = useState<ProductDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [mediaError, setMediaError] = useState(false);
  const [mediaUrl, setMediaUrl] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<'gif' | 'mp4'>('gif');
  const [isRetrying, setIsRetrying] = useState(false);
  const [mediaLoading, setMediaLoading] = useState(true);
  const [corsTestResult, setCorsTestResult] = useState<string | null>(null);
  const videoRef = useRef<any>(null);
  useColorScheme(); // systemColorScheme kullanılmıyor
  const { currentTheme } = useTheme();
  const { t } = useTranslation();

  // Tema değişikliklerini izle
  useEffect(() => {
  }, [currentTheme]);

  // Dark mode için renk değişkenleri
  const colors = {
    background: currentTheme === 'dark' ? '#121212' : '#FFFFFF',
    cardBackground: currentTheme === 'dark' ? '#1E1E1E' : '#FFFFFF',
    primaryText: currentTheme === 'dark' ? '#F3F4F6' : '#111827',
    secondaryText: currentTheme === 'dark' ? '#A1A1AA' : '#6B7280',
    border: currentTheme === 'dark' ? '#2A2A2A' : '#F3F4F6',
    divider: currentTheme === 'dark' ? '#2A2A2A' : '#F3F4F6',
    primary: '#E11D48', // Ana renk değişmez
    primaryLight: currentTheme === 'dark' ? '#3D1520' : '#FEE2E2',
    secondaryBackground: currentTheme === 'dark' ? '#2A2A2A' : '#F3F4F6',
    stepBackground: currentTheme === 'dark' ? '#262626' : '#F9FAFB',
    mediaLoadingBackground: currentTheme === 'dark' ? '#1a1a1a' : '#f5f5f5',
    errorBackground: currentTheme === 'dark' ? 'rgba(30, 30, 30, 0.9)' : 'rgba(245, 245, 245, 0.9)',
    surface: currentTheme === 'dark' ? '#2A2A2A' : '#F3F4F6',
  };

  // Tema moduna göre animasyon konteyner stilini ayarla
  const animationContainerStyle = {
    ...styles.animationContainer,
    backgroundColor: colors.mediaLoadingBackground,
    overflow: 'hidden' as const,
  };

  // Tema moduna göre video stilini ayarla
  const videoStyle = {
    ...styles.exerciseGif,
    backgroundColor: colors.mediaLoadingBackground,
  };

  // Tema moduna göre kart stilini ayarla
  const cardStyle = {
    ...styles.infoCard,
    backgroundColor: colors.cardBackground,
    borderColor: colors.border,
  };

  // Tema moduna göre bölüm kartı stilini ayarla
  const sectionCardStyle = {
    ...styles.sectionCard,
    backgroundColor: colors.cardBackground,
    borderColor: colors.border,
  };

  // Tema moduna göre adım içeriği stilini ayarla (kullanılmıyor)
  // const stepContentStyle = {
  //   ...styles.stepContent,
  //   backgroundColor: colors.stepBackground,
  // };

  // Tema moduna göre medya yükleme konteyner stilini ayarla
  const mediaLoadingContainerStyle = {
    ...styles.mediaLoadingContainer,
    backgroundColor: colors.mediaLoadingBackground,
  };

  // Tema moduna göre GIF hata konteyner stilini ayarla
  const gifErrorContainerStyle = {
    ...styles.gifErrorContainer,
    backgroundColor: colors.errorBackground,
  };

  const getImageUrl = (path?: string) => {
    if (!path) return undefined;
    return path;
  };

  // CORS testi
  const testCORS = async (url: string) => {
    if (!url || typeof url !== 'string') {
      setCorsTestResult(t('cors_test_invalid_url'));
      return;
    }

    try {
      // Önce HEAD isteği ile deneyelim (daha hızlı)
      const headResponse = await fetch(url, {
        method: 'HEAD',
        headers: {
          'Accept': 'video/mp4,video/*;q=0.9,image/gif;q=0.8,*/*;q=0.7',
          'Range': 'bytes=0-1'
        }
      });
      
      // Eğer HEAD isteği başarılıysa, GET isteği ile devam edelim
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'video/mp4,video/*;q=0.9,image/gif;q=0.8,*/*;q=0.7',
          'Range': 'bytes=0-1024' // Sadece ilk 1KB'ı iste
        }
      });
      
      // Yanıt başlıklarını logla
      const headers = Object.fromEntries([...response.headers.entries()]);
      
      // İçerik türünü kontrol et
      const contentType = response.headers.get('content-type');
      
      // İçerik uzunluğunu kontrol et
      const contentLength = response.headers.get('content-length');
      
      // Yanıtı blob olarak oku
      const blob = await response.blob();
      
      // Sonuçları değerlendir
      if (response.ok) {
        if (blob.size === 0) {
          setCorsTestResult(t('cors_test_accessible_empty').replace('{status}', response.status.toString()));
        } else {
          setCorsTestResult(t('cors_test_accessible_with_content')
            .replace('{status}', response.status.toString())
            .replace('{statusText}', response.statusText)
            .replace('{size}', blob.size.toString()));
        }
      } else {
        setCorsTestResult(t('cors_test_access_error')
          .replace('{status}', response.status.toString())
          .replace('{statusText}', response.statusText));
      }
    } catch (error: any) {
      setCorsTestResult(t('cors_test_error').replace('{message}', error.message || t('cors_test_unknown_error')));
    }
  };

  // URL'yi temizle ve doğrula
  const sanitizeAndValidateUrl = (url: string): string => {
    try {
      if (!url) return '';
      
      // URL'yi parse et
      const parsedUrl = new URL(url);
      
      // URL'nin temel kısmını al
      const baseUrl = `${parsedUrl.protocol}//${parsedUrl.hostname}${parsedUrl.pathname}`;
      
      // Token parametresini kontrol et
      const token = parsedUrl.searchParams.get('token');
      
      // Eğer token varsa, sadece token parametresini ekle
      const finalUrl = token ? `${baseUrl}?token=${token}` : baseUrl;
      
      return finalUrl;
    } catch (error) {
      console.error('URL işleme hatası:', error, url);
      
      // Hata durumunda orijinal URL'yi döndür
      return url;
    }
  };
  
  const fetchProductDetail = async () => {
    try {
      setLoading(true);
      
      // Ana egzersiz bilgilerini al
      const { data: exerciseData, error: exerciseError } = await supabase
        .from('exercises')
        .select('*')
        .eq('id', exercise.id)
        .single();

      if (exerciseError) {
        console.error('Egzersiz detayları yüklenirken hata:', exerciseError);
        return;
      }



      // Set bilgilerini al
      const { data: setData } = await supabase
        .from('exercise_sets')
        .select('*')
        .eq('exercise_id', exercise.id)
        .single();

      // Talimatları al
      const { data: instructionData } = await supabase
        .from('exercise_instructions')
        .select('*')
        .eq('exercise_id', exercise.id)
        .order('step_number', { ascending: true });

      if (exerciseData) {
        const instructions = instructionData || [];
        
        // Video tipini ve URL'sini belirle
        let videoUrl = exerciseData.gif_url || exerciseData.mp4_url || null;
        let videoType: 'gif' | 'mp4' = 'gif';
        
        if (videoUrl) {
          // URL'yi düzelt ve doğrula
          videoUrl = sanitizeAndValidateUrl(videoUrl);
          
          // Dosya uzantısına göre video tipini belirle
          if (videoUrl.toLowerCase().endsWith('.mp4')) {
            videoType = 'mp4';
          } else if (videoUrl.toLowerCase().endsWith('.gif')) {
            videoType = 'gif';
          } else {
            // Uzantı yoksa, içerik tipine göre tahmin et
            videoType = videoUrl.includes('mp4') ? 'mp4' : 'gif';
          }
        }

        const productDetailData = {
          content: {
            title1: instructions[0]?.instruction,
            description1: instructions[0]?.tip,
            title2: instructions[1]?.instruction,
            description2: instructions[1]?.tip,
            title3: instructions[2]?.instruction,
            description3: instructions[2]?.tip,
            title4: instructions[3]?.instruction,
            description4: instructions[3]?.tip,
            title5: instructions[4]?.instruction,
            description5: instructions[4]?.tip,
          },
          externalLink: videoUrl,
          videoType: videoType,
          image: exerciseData.image,
          mainCategory: exerciseData.target,
          name: exerciseData.name,
          subCategories: exerciseData.muscle_group?.join(', '),
          recommendedSet: setData?.sets?.toString(),
          recommendedRepeat: setData?.reps?.toString(),
          recommendedAwaitTime: setData?.rest_time?.toString()
        };

        setProductDetail(productDetailData);
        setMediaType(videoType);
        setMediaError(false);

        // Önbelleğe kaydet
        await AsyncStorage.setItem(
          `exercise_${exercise.id}`,
          JSON.stringify({
            data: productDetailData,
            timestamp: Date.now()
          })
        );
      }
    } catch (error) {
      console.error('Ürün detayı alınırken hata:', error);
      setMediaError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        // Önbellekten veriyi kontrol et
        const cachedData = await AsyncStorage.getItem(`exercise_${exercise.id}`);
        if (cachedData) {
          const { data, timestamp } = JSON.parse(cachedData);
          // 5 dakikadan eski değilse önbellekten göster
          if (Date.now() - timestamp < 5 * 60 * 1000) {
            setProductDetail(data);
            setLoading(false);
            return;
          }
        }
        // Önbellekte veri yoksa veya eskiyse yeni veri çek
        await fetchProductDetail();
      } catch (error) {
        console.error('Veri yüklenirken hata:', error);
        await fetchProductDetail();
      }
    };
    
    loadData();
    return () => {
      setProductDetail(null);
      setLoading(true);
    };
  }, [exercise.id]);

  useEffect(() => {
    if (productDetail && (!productDetail.content || Object.keys(productDetail.content).length === 0)) {
      // setSelectedTab('overview');
    }
  }, [productDetail]);

  useEffect(() => {
    if (productDetail?.externalLink) {
      const url = sanitizeAndValidateUrl(productDetail.externalLink);
      

      
      // Video bileşeni için URL'yi ayarla (zaman damgası ekleme)
      setMediaUrl(url);
      setMediaType(productDetail.videoType || 'gif');
      
      // CORS testi yap
      testCORS(url);
    }
  }, [productDetail?.externalLink]);

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={[styles.backButtonText, { color: colors.primaryText }]}>{'<'}</Text>
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text 
            style={[styles.headerTitle, { color: colors.primaryText }]} 
            numberOfLines={1} 
            ellipsizeMode="tail"
          >
            {exercise.name}
          </Text>
        </View>
      </View>

      <ScrollView style={[styles.content, { backgroundColor: colors.background }]} showsVerticalScrollIndicator={false}>
        {mediaUrl && (
          <View style={animationContainerStyle}>
            {mediaLoading && !mediaError && (
              <View style={mediaLoadingContainerStyle}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={[styles.mediaLoadingText, { color: colors.secondaryText }]}>{t('workout_info_loading_media')}</Text>
              </View>
            )}
            
            {mediaType === 'gif' ? (
              <View pointerEvents="none" style={{ width: '100%', height: '100%' }}>
                <Image
                  source={{
                    uri: mediaUrl,
                    cache: 'force-cache',
                    headers: {
                      'Accept': 'image/gif,image/*;q=0.8',
                    }
                  }}
                  style={[videoStyle, mediaLoading && !mediaError ? { opacity: 0 } : { opacity: 1 }]}
                  resizeMode="cover"
                  onLoadStart={() => {
                    setMediaLoading(true);
                  }}
                  onLoadEnd={() => {
                    setMediaLoading(false);
                  }}
                  onError={(error: any) => {
                    setMediaLoading(false);
                    setMediaError(true);
                    
                    // Hata durumunda URL'yi tekrar test et
                    if (productDetail?.externalLink) {
                      const url = sanitizeAndValidateUrl(productDetail.externalLink);
                      testCORS(url);
                    }
                  }}
                />
              </View>
            ) : (
              <View pointerEvents="none" style={{ width: '100%', height: '100%' }}>
                <Video
                  ref={videoRef}
                  source={{ 
                    uri: mediaUrl,
                    type: 'mp4',
                    headers: {
                      'Accept': 'video/mp4,video/*;q=0.9',
                      'Range': 'bytes=0-'
                    }
                  }}
                  style={[videoStyle, mediaLoading && !mediaError ? { opacity: 0 } : { opacity: 1 }]}
                  resizeMode="cover"
                  repeat={true}
                  rate={1.0}
                  volume={1.0}
                  muted={false}
                  paused={false}
                  playInBackground={false}
                  playWhenInactive={false}
                  progressUpdateInterval={250}
                  onLoadStart={() => {
                    setMediaLoading(true);
                  }}
                  onReadyForDisplay={() => {
                    setMediaLoading(false);
                  }}
                  onError={(error) => {
                    setMediaLoading(false);
                    setMediaError(true);
                    
                    // Hata durumunda URL'yi tekrar test et
                    if (productDetail?.externalLink) {
                      const url = sanitizeAndValidateUrl(productDetail.externalLink);
                      testCORS(url);
                    }
                  }}
                  onLoad={() => {
                    setMediaLoading(false);
                    setMediaError(false);
                  }}
                  ignoreSilentSwitch="ignore"
                  useTextureView={true}
                  bufferConfig={{
                    minBufferMs: 15000,
                    maxBufferMs: 50000,
                    bufferForPlaybackMs: 2500,
                    bufferForPlaybackAfterRebufferMs: 5000
                  }}
                />
              </View>
            )}
            
            {mediaError && (
              <View style={gifErrorContainerStyle}>
                <Text style={[styles.gifErrorText, { color: colors.secondaryText }]}>{t('workout_info_media_error')}</Text>
                {corsTestResult && (
                  <Text style={[styles.corsTestText, { color: colors.secondaryText }]}>{t('cors_test_label')} {corsTestResult}</Text>
                )}
                <TouchableOpacity 
                  style={styles.retryButton}
                  disabled={isRetrying}
                  onPress={() => {
                    setIsRetrying(true);
                    setMediaError(false);
                    setMediaLoading(true);
                     
                    // URL'yi düzelt ve doğrula
                    const baseUrl = productDetail?.externalLink || '';
                    const cleanUrl = sanitizeAndValidateUrl(baseUrl);
                     

                     
                    // CORS testi yap
                    testCORS(cleanUrl);
                     
                    // Kısa bir gecikme ile yeni URL'yi ayarla
                    setTimeout(() => {
                      setMediaUrl(cleanUrl);
                      setIsRetrying(false);
                    }, 500);
                  }}
                >
                  <Text style={[styles.retryButtonText, { color: colors.primary }]}>
                    {isRetrying ? t('workout_info_loading') : t('workout_info_retry')}
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}

        <View style={cardStyle}>
          <View style={styles.exerciseHeader}>
            {productDetail?.image && (
              <View style={styles.exerciseIconContainer}>
                <Image
                  source={{ uri: getImageUrl(productDetail.image) }}
                  style={styles.exerciseIconImage}
                  resizeMode="cover"
                />
              </View>
            )}
            <View style={styles.exerciseInfo}>
              <Text style={[styles.exerciseName, { color: colors.primaryText }]}>{productDetail?.name || exercise.name}</Text>
              <Text style={[styles.exerciseTarget, { color: colors.secondaryText }]}>{productDetail?.mainCategory || exercise.target}</Text>
            </View>
          </View>

          <View style={[styles.divider, { backgroundColor: colors.divider }]} />

          {/* Exercise Details */}
          <View style={styles.detailsContainer}>
            <View style={styles.muscleGroupsContainer}>
              <View style={styles.muscleGroups}>
                <View style={styles.muscleGroup}>
                  <Text style={[styles.muscleGroupTitle, { color: colors.secondaryText }]}>{t('workout_info_primary_muscle_group')}</Text>
                  <View style={[styles.muscleTag, styles.primaryTag, { backgroundColor: colors.primaryLight }]}>
                    <Text style={[styles.muscleTagText, styles.primaryTagText]}>{productDetail?.mainCategory || exercise.target}</Text>
                  </View>
                </View>
                <View style={styles.muscleGroup}>
                  <Text style={[styles.muscleGroupTitle, { color: colors.secondaryText }]}>{t('workout_info_secondary_muscle_group')}</Text>
                  <View style={[styles.muscleTag, styles.secondaryTag, { backgroundColor: colors.secondaryBackground }]}>
                    <Text style={[styles.muscleTagText, styles.secondaryTagText, { color: colors.secondaryText }]}>-</Text>
                  </View>
                </View>
              </View>
            </View>

            {productDetail?.recommendedSet && (
              <View style={styles.detailItem}>
                <Text style={[styles.detailLabel, { color: colors.secondaryText }]}>{t('workout_info_recommended_set')}</Text>
                <Text style={[styles.detailValue, { color: colors.primaryText }]}>{productDetail.recommendedSet || '3'}</Text>
              </View>
            )}

            {productDetail?.recommendedRepeat && (
              <View style={styles.detailItem}>
                <Text style={[styles.detailLabel, { color: colors.secondaryText }]}>{t('workout_info_recommended_reps')}</Text>
                <Text style={[styles.detailValue, { color: colors.primaryText }]}>{productDetail.recommendedRepeat || '12'}</Text>
              </View>
            )}

            {productDetail?.recommendedAwaitTime && (
              <View style={styles.detailItem}>
                <Text style={[styles.detailLabel, { color: colors.secondaryText }]}>{t('workout_info_recommended_rest')}</Text>
                <Text style={[styles.detailValue, { color: colors.primaryText }]}>{productDetail.recommendedAwaitTime || '60 sn'}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Personal Records */}
        <View style={sectionCardStyle}>
          <Text style={[styles.sectionTitle, { color: colors.primaryText }]}>{t('workout_info_personal_records')}</Text>
          <View style={styles.lockedContent}>
            <View style={styles.statsGrid}>
              <View style={styles.statItem}>
                <Text style={[styles.statLabel, { color: colors.secondaryText }]}>{t('workout_info_highest_weight')}</Text>
                <Text style={[styles.statValue, { color: colors.primaryText }]}>🔒</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={[styles.statLabel, { color: colors.secondaryText }]}>{t('workout_info_total_reps')}</Text>
                <Text style={[styles.statValue, { color: colors.primaryText }]}>🔒</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={[styles.statLabel, { color: colors.secondaryText }]}>{t('workout_info_average_set')}</Text>
                <Text style={[styles.statValue, { color: colors.primaryText }]}>🔒</Text>
              </View>
            </View>
            <View style={[styles.comingSoonBadge, { backgroundColor: '#FEE2E2', marginTop: 16 }]}>
              <Text style={[styles.comingSoonText, { color: '#E11D48' }]}>{t('workout_info_coming_soon')}</Text>
            </View>
          </View>
        </View>

        {/* Statistics */}
        <View style={sectionCardStyle}>
          <Text style={[styles.sectionTitle, { color: colors.primaryText }]}>{t('workout_info_statistics')}</Text>
          <View style={styles.lockedContent}>
            <View style={styles.statsGrid}>
              <View style={styles.statItem}>
                <Text style={[styles.statLabel, { color: colors.secondaryText }]}>{t('workout_info_total_weight')}</Text>
                <Text style={[styles.statValue, { color: colors.primaryText }]}>🔒</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={[styles.statLabel, { color: colors.secondaryText }]}>{t('workout_info_monthly_progress')}</Text>
                <Text style={[styles.statValue, { color: colors.primaryText }]}>🔒</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={[styles.statLabel, { color: colors.secondaryText }]}>{t('workout_info_success_rate')}</Text>
                <Text style={[styles.statValue, { color: colors.primaryText }]}>🔒</Text>
              </View>
            </View>
            <View style={[styles.comingSoonBadge, { backgroundColor: '#FEE2E2', marginTop: 16 }]}>
              <Text style={[styles.comingSoonText, { color: '#E11D48' }]}>{t('workout_info_coming_soon')}</Text>
            </View>
          </View>
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
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  backButton: {
    position: 'absolute',
    left: 16,
    zIndex: 1,
    padding: 8,
  },
  backButtonText: {
    fontSize: 24,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  animationContainer: {
    width: SCREEN_WIDTH - 40,
    height: (SCREEN_WIDTH - 40) * 0.75,
    marginHorizontal: 20,
    marginTop: 20,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderRadius: 10,
  },
  animation: {
    width: 200,
    height: 200,
  },
  infoCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginVertical: 16,
    borderRadius: 16,
    padding: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
    }),
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  exerciseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  exerciseIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    overflow: 'hidden',
  },
  exerciseIconImage: {
    width: '100%',
    height: '100%',
  },
  exerciseIcon: {
    fontSize: 24,
  },
  exerciseInfo: {
    flex: 1,
  },
  exerciseName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  exerciseTarget: {
    fontSize: 16,
    color: '#6B7280',
  },
  divider: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginVertical: 16,
  },
  detailsContainer: {
    gap: 16,
  },
  muscleGroupsContainer: {
    marginBottom: 8,
  },
  muscleGroups: {
    marginTop: 8,
    gap: 12,
  },
  muscleGroup: {
    gap: 8,
  },
  muscleGroupTitle: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  muscleTag: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  primaryTag: {
    backgroundColor: '#FEE2E2',
  },
  secondaryTag: {
    backgroundColor: '#F3F4F6',
  },
  muscleTagText: {
    fontSize: 14,
    fontWeight: '600',
  },
  primaryTagText: {
    color: '#E11D48',
  },
  secondaryTagText: {
    color: '#6B7280',
  },
  detailItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 16,
    color: '#6B7280',
  },
  detailValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 16,
    padding: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
    }),
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 10,
  },
  comingSoonBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  comingSoonText: {
    fontSize: 12,
    fontWeight: '600',
  },
  lockedContent: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  lockedText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  lockedDescription: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    paddingHorizontal: 16,
    lineHeight: 20,
    marginBottom: 16,
  },
  featureList: {
    width: '100%',
    paddingHorizontal: 24,
  },
  featureItem: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 24,
    marginBottom: 8,
  },
  stepContainer: {
    gap: 24,
    paddingBottom: 16,
    paddingTop: 8,
  },
  stepItem: {
    flexDirection: 'row',
    gap: 16,
    minHeight: 100,
  },
  stepNumberContainer: {
    alignItems: 'center',
    height: '100%',
  },
  stepNumber: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#E11D48',
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#E11D48',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  stepNumberText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  stepLine: {
    width: 2,
    flex: 1,
    backgroundColor: '#E5E7EB',
    marginTop: 8,
  },
  stepContent: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    padding: 20,
    minHeight: 100,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  stepTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
    letterSpacing: -0.2,
  },
  stepText: {
    fontSize: 15,
    color: '#4B5563',
    lineHeight: 22,
    letterSpacing: -0.1,
  },
  stepIconContainer: {
    marginTop: 12,
    alignItems: 'flex-end',
  },
  stepIcon: {
    fontSize: 24,
  },
  tipsContainer: {
    gap: 12,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  tipIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FEE2E2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tipContent: {
    flex: 1,
  },
  tipTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  tipIcon: {
    fontSize: 20,
    color: '#E11D48',
  },
  tipText: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginVertical: 16,
    paddingHorizontal: 8,
  },
  statItem: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  loadingText: {
    textAlign: 'center',
    marginTop: 20,
    fontSize: normalize(16),
  },
  exerciseGif: {
    width: '100%',
    height: '100%',
    borderRadius: 12
  },
  exerciseTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  exerciseCategory: {
    fontSize: 16,
    color: '#6B7280',
  },
  placeholderContainer: {
    width: '100%',
    height: '100%',
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: 48,
  },
  infoContainer: {
    padding: normalize(20),
  },
  categoryText: {
    fontSize: normalize(16),
    color: '#666',
    marginBottom: normalize(20),
  },
  contentContainer: {
    marginTop: normalize(20),
  },
  contentItem: {
    marginBottom: normalize(20),
  },
  contentTitle: {
    fontSize: normalize(18),
    fontWeight: '600',
    marginBottom: normalize(8),
    color: '#E11D48',
  },
  contentDescription: {
    fontSize: normalize(16),
    lineHeight: normalize(24),
    color: '#333',
  },
  videoButton: {
    backgroundColor: '#E11D48',
    padding: normalize(16),
    borderRadius: normalize(12),
    alignItems: 'center',
    marginTop: normalize(20),
  },
  videoButtonText: {
    color: '#fff',
    fontSize: normalize(16),
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    height: '100%',
  },
  contentDetailsSection: {
    marginTop: 16,
  },
  contentDetailsSectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
  },
  contentDetailsItem: {
    marginBottom: 16,
  },
  contentDetailsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#E11D48',
    marginBottom: 8,
  },
  contentDetailsDescription: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  gifErrorContainer: {
    position: 'absolute',
    zIndex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(245, 245, 245, 0.9)',
    borderRadius: 12
  },
  gifErrorText: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 12,
  },
  retryButton: {
    backgroundColor: '#E11D48',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  mediaLoadingContainer: {
    position: 'absolute',
    zIndex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    height: '100%',
    backgroundColor: '#f5f5f5',
    borderRadius: 12
  },
  mediaLoadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6B7280',
  },
  corsTestText: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 12,
    textAlign: 'center',
  },
});

export default WorkoutInfoScreen; 