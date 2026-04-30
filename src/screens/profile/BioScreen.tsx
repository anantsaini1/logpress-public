import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  Platform,
  StatusBar,
  Dimensions,
  Alert,
  ActivityIndicator,
  PermissionsAndroid,
} from 'react-native';
import { SvgXml } from 'react-native-svg';
import { NavigationProps } from '../../types/navigation';
import { useTheme } from '../../context/ThemeContext';
import { supabase } from '../../services/supabase';
import { useToastService } from '../../services/toast';
import { storage } from '../../services/storage';
import { SUPABASE_URL } from '../../config/supabase';
import { launchImageLibrary } from 'react-native-image-picker';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { updateProfileImage, updateProfileData, selectUser, refreshUser } from '../../store/slices/userSlice';
import { useRoute } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const backIcon = `
<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M15 18L9 12L15 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
</svg>
`;

interface BioScreenProps {
  navigation: NavigationProps;
}

const BioScreen: React.FC<BioScreenProps> = ({ navigation }) => {
  const { colors, currentTheme } = useTheme();
  const { showToast } = useToastService();
  const dispatch = useAppDispatch();
  const currentUser = useAppSelector(selectUser);
  const { t } = useTranslation();
  
  const [bio, setBio] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [instagram, setInstagram] = useState('');
  const [twitter, setTwitter] = useState('');
  const [linkedin, setLinkedin] = useState('');
  const [website, setWebsite] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  const requestStoragePermission = async () => {
    if (Platform.OS === 'android') {
      try {
        if (Platform.Version >= 33) {
          const permission = PermissionsAndroid.PERMISSIONS.READ_MEDIA_IMAGES;
          const granted = await PermissionsAndroid.request(permission);
          return granted === PermissionsAndroid.RESULTS.GRANTED;
        } else {
          const permission = PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE;
          const granted = await PermissionsAndroid.request(permission);
          return granted === PermissionsAndroid.RESULTS.GRANTED;
        }
      } catch (err) {
        console.error('İzin hatası:', err);
        return false;
      }
    }
    return true; // iOS için izin kontrolü kütüphane tarafından yapılıyor
  };

  const handleImagePicker = async () => {
    try {
      const hasPermission = await requestStoragePermission();
      if (!hasPermission && Platform.OS === 'android') {
        Alert.alert(t('bio_screen_permission_error_title'), t('bio_screen_permission_error_message'));
        return;
      }

      setIsUploadingImage(true);
      
      const result = await launchImageLibrary({
        mediaType: 'photo',
        quality: 0.7,
        maxWidth: 1024,
        maxHeight: 1024,
        selectionLimit: 1,
        includeBase64: true, // Her iki platform için base64 kullan
        presentationStyle: 'fullScreen'
      });
      
      if (result.didCancel || !result.assets || result.assets.length === 0) {
        setIsUploadingImage(false);
        return;
      }
      
      const selectedAsset = result.assets[0];
      
      if (!selectedAsset.base64) {
        Alert.alert(t('bio_screen_permission_error_title'), t('bio_screen_photo_data_error'));
        setIsUploadingImage(false);
        return;
      }
      
      console.log('Selected asset:', {
        uri: selectedAsset.uri,
        hasBase64: !!selectedAsset.base64,
        type: selectedAsset.type,
        fileSize: selectedAsset.fileSize
      });
      
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          Alert.alert(t('bio_screen_permission_error_title'), t('bio_screen_session_not_found_error'));
          setIsUploadingImage(false);
          return;
        }
        
        const fileName = `${user.id}_${Date.now()}.jpg`;
        
        // Eski profil fotoğrafını sil
        if (profileImage && profileImage.includes('profile_images')) {
          const oldImagePath = profileImage.split('/').pop()?.split('?')[0];
          if (oldImagePath) {
            try {
              await supabase.storage
                .from('profile_images')
                .remove([oldImagePath]);
            } catch (removeError) {
              console.error('Eski fotoğraf silinirken hata:', removeError);
            }
          }
        }

        // Base64'ü binary'ye çevir
        const base64Data = selectedAsset.base64;
        const byteCharacters = atob(base64Data);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);

        // Supabase storage upload
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('profile_images')
          .upload(fileName, byteArray, {
            contentType: 'image/jpeg',
            upsert: true
          });

        if (uploadError) {
          console.error('Upload error:', uploadError);
          throw uploadError;
        }
        
        const { data: { publicUrl } } = supabase.storage
          .from('profile_images')
          .getPublicUrl(fileName);
        
        let cleanUrl = `${publicUrl.replace('profile_images//', 'profile_images/')}?t=${Date.now()}`;
        
        // 1. Supabase'e kaydet
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ profile_image_url: cleanUrl })
          .eq('id', user.id);

        if (updateError) {
          throw updateError;
        }
        
        // Adapty'e kaydetmeye gerek yok - sadece ödeme sistemi
        
        // 2. Local storage'a kaydet ve Redux'ı güncelle
        setProfileImage(cleanUrl);
        await storage.setItem('profile_image_url', cleanUrl);
        
        // 3. Redux'ta profil fotoğrafını güncelle (global state)
        dispatch(updateProfileImage(cleanUrl));
        
        Alert.alert(t('bio_screen_photo_upload_success_title'), t('bio_screen_photo_upload_success_message'));
      } catch (error) {
        console.error('Fotoğraf yükleme hatası:', error);
        Alert.alert(t('bio_screen_permission_error_title'), t('bio_screen_photo_upload_error'));
      } finally {
        setIsUploadingImage(false);
      }
    } catch (error) {
      console.error('Fotoğraf seçme hatası:', error);
      Alert.alert(t('bio_screen_permission_error_title'), t('bio_screen_photo_select_error'));
      setIsUploadingImage(false);
    }
  };

  useEffect(() => {
    const loadUserProfile = async () => {
      try {
        // 1. Redux'tan mevcut user bilgilerini al
        if (currentUser) {
          if (currentUser.display_name) setDisplayName(currentUser.display_name);
          if (currentUser.bio) setBio(currentUser.bio);
          if (currentUser.instagram) setInstagram(currentUser.instagram);
          if (currentUser.twitter) setTwitter(currentUser.twitter);
          if (currentUser.linkedin) setLinkedin(currentUser.linkedin);
          if (currentUser.website) setWebsite(currentUser.website);
          if (currentUser.profile_image_url) setProfileImage(currentUser.profile_image_url);
        }

        // 2. Local storage'dan profil fotoğrafını kontrol et
        const localProfileImage = await storage.getItem('profile_image_url');
        if (localProfileImage && !profileImage) {
          setProfileImage(localProfileImage);
        }

        // 3. Supabase'den bilgileri al (fallback)
        const { data: { user } } = await supabase.auth.getUser();
         
        if (!user) {
          showToast('error', t('bio_screen_session_not_found_error'));
          return;
        }

        // Kullanıcı adını user metadata'dan al (eğer Redux'ta yoksa)
        if (user.user_metadata?.display_name && !displayName) {
          setDisplayName(user.user_metadata.display_name);
        }

        const { data: profileData, error } = await supabase
          .from('profiles')
          .select('bio, instagram, twitter, linkedin, website, profile_image_url')
          .eq('id', user.id)
          .single();

        if (error) {
          console.error('Profil bilgileri alınırken hata:', error);
          return;
        }

        if (profileData) {
          // Supabase'den profil bilgilerini doldur (sadece boş olanlar)
          if (profileData.bio && !bio) setBio(profileData.bio);
          if (profileData.instagram && !instagram) setInstagram(profileData.instagram);
          if (profileData.twitter && !twitter) setTwitter(profileData.twitter);
          if (profileData.linkedin && !linkedin) setLinkedin(profileData.linkedin);
          if (profileData.website && !website) setWebsite(profileData.website);
          
          // Profil fotoğrafı için güncellik kontrolü
          if (profileData.profile_image_url && profileData.profile_image_url !== localProfileImage && !profileImage) {
            setProfileImage(profileData.profile_image_url);
            await storage.setItem('profile_image_url', profileData.profile_image_url);
          }
        }
      } catch (error) {
        console.error('Profil yüklenirken hata:', error);
        showToast('error', t('bio_screen_profile_load_error'));
      }
    };

    loadUserProfile();
  }, [currentUser]); // currentUser dependency eklendi

  const handleSave = async () => {
    try {
      setIsLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        showToast('error', t('bio_screen_session_not_found_error'));
        return;
      }

      // Kullanıcı adı validasyonu - boşsa kaydetme
      const finalDisplayName = displayName.trim();
      if (!finalDisplayName) {
        showToast('error', t('bio_screen_username_required_toast'));
        setIsLoading(false);
        return;
      }

      // 1. Kullanıcı adını Supabase auth'ta güncelle
      const { error: updateUserError } = await supabase.auth.updateUser({
        data: { display_name: finalDisplayName }
      });

      if (updateUserError) {
        console.error('Kullanıcı adı güncellenirken hata:', updateUserError);
        showToast('error', t('bio_screen_username_update_error'));
        return;
      }

      // 2. Profil bilgilerini Supabase'e kaydet
      const { error } = await supabase
        .from('profiles')
        .update({
          display_name: finalDisplayName,
          bio,
          instagram,
          twitter,
          linkedin,
          website,
        })
        .eq('id', user.id);

      if (error) throw error;

      // 3. Local storage'ı güncelle
      const userInfo = await storage.getUserInfo();
      if (userInfo) {
        const updatedUserInfo = {
          ...userInfo,
          display_name: finalDisplayName
        };
        await storage.setUserInfo(updatedUserInfo);
      }

      // 4. Redux'ta profil bilgilerini güncelle (global state)
      await dispatch(updateProfileData({
        display_name: finalDisplayName,
        name: finalDisplayName, // name field'ını da güncelleyip senkronize et
        bio,
        instagram,
        twitter,
        linkedin,
        website
      }));

      // 5. User data'yı refresh et ki HomeScreen güncellensin
      await dispatch(refreshUser());

      showToast('success', t('bio_screen_profile_update_success'));
      navigation.goBack();
    } catch (error) {
      console.error('Profil güncellenirken hata:', error);
      showToast('error', t('bio_screen_profile_update_error'));
    } finally {
      setIsLoading(false);
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
        borderBottomColor: colors.cardBorder,
        borderBottomWidth: 1,
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
        <Text style={[styles.headerTitle, { color: colors.text }]}>{t('bio_screen_title')}</Text>
        <TouchableOpacity 
          style={[styles.saveButton, { opacity: isLoading ? 0.5 : 1 }]} 
          onPress={handleSave}
          disabled={isLoading}
        >
          <Text style={[styles.saveButtonText, { color: colors.primary }]}>
            {t('bio_screen_save_button')}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={[styles.photoSection, { backgroundColor: colors.background }]}>
            <View style={[styles.profileImageContainer, {
              backgroundColor: colors.card,
              borderColor: colors.border,
              ...Platform.select({
                ios: {
                  shadowColor: currentTheme === 'dark' ? '#000' : '#2563eb',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.15,
                  shadowRadius: 8,
                },
                android: {
                  elevation: 4,
                },
              }),
            }]}>
              <Image
                source={profileImage ? { uri: profileImage } : require('../../assets/logo.png')}
                style={[
                  styles.profileImage,
                  !profileImage && { tintColor: currentTheme === 'light' ? colors.primary : colors.text }
                ]}
              />
              {isUploadingImage && (
                <View style={[styles.uploadingOverlay, { backgroundColor: 'rgba(0,0,0,0.5)' }]}>
                  <ActivityIndicator size="large" color={colors.primary} />
                </View>
              )}
            </View>
            <TouchableOpacity
              style={[styles.addPhotoButton, {
                backgroundColor: colors.primary,
                opacity: isUploadingImage ? 0.5 : 1,
                ...Platform.select({
                  ios: {
                    shadowColor: currentTheme === 'dark' ? '#000' : '#2563eb',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.15,
                    shadowRadius: 8,
                  },
                  android: {
                    elevation: 4,
                  },
                }),
              }]}
              onPress={handleImagePicker}
              disabled={isUploadingImage}
            >
              <Text style={styles.addPhotoText}>
                {isUploadingImage ? t('bio_screen_loading_photo_button') : t('bio_screen_add_photo_button')}
              </Text>
            </TouchableOpacity>
          </View>

        <View style={[styles.section, { 
          backgroundColor: colors.card,
          ...Platform.select({
            ios: {
              shadowColor: currentTheme === 'dark' ? '#000' : '#2563eb',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 8,
            },
            android: {
              elevation: 2,
            },
          }),
        }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('bio_screen_username_section_title')}</Text>
          <TextInput
            style={[styles.socialInput, { 
              color: colors.text,
              backgroundColor: currentTheme === 'dark' ? colors.background : '#F8FAFC',
              borderColor: colors.cardBorder
            }]}
            placeholder={t('bio_screen_username_placeholder')}
            placeholderTextColor={colors.textSecondary}
            value={displayName}
            onChangeText={setDisplayName}
            maxLength={30}
          />
          <Text style={[styles.charCount, { color: colors.textSecondary }]}>
            {displayName.length}/30
          </Text>
        </View>

        <View style={[styles.section, { 
          backgroundColor: colors.card,
          ...Platform.select({
            ios: {
              shadowColor: currentTheme === 'dark' ? '#000' : '#2563eb',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 8,
            },
            android: {
              elevation: 2,
            },
          }),
        }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('bio_screen_about_section_title')}</Text>
          <TextInput
            style={[styles.bioInput, { 
              color: colors.text,
              backgroundColor: currentTheme === 'dark' ? colors.background : '#F8FAFC',
              borderColor: colors.cardBorder
            }]}
            placeholder={t('bio_screen_bio_placeholder')}
            placeholderTextColor={colors.textSecondary}
            value={bio}
            onChangeText={setBio}
            multiline
            maxLength={500}
          />
          <Text style={[styles.charCount, { color: colors.textSecondary }]}>
            {bio.length}/500
          </Text>
        </View>

        <View style={[styles.section, {
            backgroundColor: colors.card,
            ...Platform.select({
              ios: {
                shadowColor: currentTheme === 'dark' ? '#000' : '#2563eb',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 8,
              },
              android: {
                elevation: 2,
              },
            }),
          }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('bio_screen_social_media_section_title')}</Text>
            
            <View style={styles.socialInputContainer}>
              <Text style={[styles.socialLabel, { color: colors.textSecondary }]}>{t('bio_screen_label_instagram')}</Text>
              <TextInput
                style={[styles.socialInput, {
                  color: colors.text,
                  backgroundColor: currentTheme === 'dark' ? colors.background : '#F8FAFC',
                  borderColor: colors.cardBorder
                }]}
                placeholder={t('bio_screen_instagram_placeholder')}
                placeholderTextColor={colors.textSecondary}
                value={instagram}
                onChangeText={setInstagram}
              />
            </View>

            <View style={styles.socialInputContainer}>
              <Text style={[styles.socialLabel, { color: colors.textSecondary }]}>{t('bio_screen_label_twitter')}</Text>
              <TextInput
                style={[styles.socialInput, {
                  color: colors.text,
                  backgroundColor: currentTheme === 'dark' ? colors.background : '#F8FAFC',
                  borderColor: colors.cardBorder
                }]}
                placeholder={t('bio_screen_twitter_placeholder')}
                placeholderTextColor={colors.textSecondary}
                value={twitter}
                onChangeText={setTwitter}
              />
            </View>

            <View style={styles.socialInputContainer}>
              <Text style={[styles.socialLabel, { color: colors.textSecondary }]}>{t('bio_screen_label_linkedin')}</Text>
              <TextInput
                style={[styles.socialInput, {
                  color: colors.text,
                  backgroundColor: currentTheme === 'dark' ? colors.background : '#F8FAFC',
                  borderColor: colors.cardBorder
                }]}
                placeholder={t('bio_screen_linkedin_placeholder')}
                placeholderTextColor={colors.textSecondary}
                value={linkedin}
                onChangeText={setLinkedin}
              />
            </View>

            <View style={styles.socialInputContainer}>
              <Text style={[styles.socialLabel, { color: colors.textSecondary }]}>{t('bio_screen_label_website')}</Text>
              <TextInput
                style={[styles.socialInput, {
                  color: colors.text,
                  backgroundColor: currentTheme === 'dark' ? colors.background : '#F8FAFC',
                  borderColor: colors.cardBorder
                }]}
                placeholder={t('bio_screen_website_placeholder')}
                placeholderTextColor={colors.textSecondary}
                value={website}
                onChangeText={setWebsite}
              />
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
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  saveButton: {
    padding: 8,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  photoSection: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  profileImageContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 0,
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  addPhotoButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  addPhotoText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  section: {
    marginHorizontal: 16,
    marginBottom: 24,
    padding: 16,
    borderRadius: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  bioInput: {
    minHeight: 120,
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    textAlignVertical: 'top',
  },
  charCount: {
    fontSize: 12,
    textAlign: 'right',
    marginTop: 4,
  },
  socialInputContainer: {
    marginBottom: 16,
  },
  socialLabel: {
    fontSize: 14,
    marginBottom: 8,
  },
  socialInput: {
    height: 44,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 16,
  },
  uploadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default BioScreen; 