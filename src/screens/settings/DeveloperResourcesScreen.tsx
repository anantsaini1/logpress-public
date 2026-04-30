import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  Clipboard,
  RefreshControl,
  TextInput,
  StatusBar,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NavigationProps } from '../../types/navigation';
import { useTheme } from '../../context/ThemeContext';
import { storage } from '../../services/storage';
import { useToastService } from '../../services/toast';
import { getUserInfo } from '../../services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SvgXml } from 'react-native-svg';
import { useTranslation } from 'react-i18next';

const backIcon = `
<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M15 18L9 12L15 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
</svg>
`;

interface StorageData {
  title: string;
  key: string;
  data: any;
}

// JSON görüntüleyici bileşeni
const JSONViewer = ({ data, indentLevel = 0 }: { data: any; indentLevel?: number }) => {
  const { colors } = useTheme();
  const indent = '  '.repeat(indentLevel);
  
  if (data === null) {
    return <Text style={[styles.jsonNull, { color: colors.error }]}>{indent}null</Text>;
  }
  
  if (typeof data === 'undefined') {
    return <Text style={[styles.jsonUndefined, { color: colors.error }]}>{indent}undefined</Text>;
  }
  
  if (typeof data === 'string') {
    return <Text style={[styles.jsonString, { color: '#16A34A' }]}>{indent}"{data}"</Text>;
  }
  
  if (typeof data === 'number') {
    return <Text style={[styles.jsonNumber, { color: '#3B82F6' }]}>{indent}{data}</Text>;
  }
  
  if (typeof data === 'boolean') {
    return <Text style={[styles.jsonBoolean, { color: '#9333EA' }]}>{indent}{data ? 'true' : 'false'}</Text>;
  }
  
  if (Array.isArray(data)) {
    if (data.length === 0) {
      return <Text style={{ color: colors.textSecondary }}>{indent}[]</Text>;
    }
    
    return (
      <View>
        <Text style={{ color: colors.textSecondary }}>{indent}[</Text>
        {data.map((item, index) => (
          <View key={index} style={{ flexDirection: 'row' }}>
            <JSONViewer data={item} indentLevel={indentLevel + 1} />
            {index < data.length - 1 && <Text style={{ color: colors.textSecondary }}>,</Text>}
          </View>
        ))}
        <Text style={{ color: colors.textSecondary }}>{indent}]</Text>
      </View>
    );
  }
  
  if (typeof data === 'object') {
    const keys = Object.keys(data);
    
    if (keys.length === 0) {
      return <Text style={{ color: colors.textSecondary }}>{indent}{'{}'}</Text>;
    }
    
    return (
      <View>
        <Text style={{ color: colors.textSecondary }}>{indent}{'{'}</Text>
        {keys.map((key, index) => (
          <View key={key} style={{ flexDirection: 'row' }}>
            <Text style={[styles.jsonKey, { color: '#E11D48' }]}>{indent}  "{key}"</Text>
            <Text style={{ color: colors.textSecondary }}>: </Text>
            <View style={{ flex: 1 }}>
              <JSONViewer data={data[key]} indentLevel={0} />
            </View>
            {index < keys.length - 1 && <Text style={{ color: colors.textSecondary }}>,</Text>}
          </View>
        ))}
        <Text style={{ color: colors.textSecondary }}>{indent}{'}'}</Text>
      </View>
    );
  }
  
  return <Text style={{ color: colors.textSecondary }}>{indent}{String(data)}</Text>;
};

const DeveloperResourcesScreen = () => {
  const navigation = useNavigation<NavigationProps>();
  const { colors, currentTheme } = useTheme();
  const { t } = useTranslation();
  const { showToast } = useToastService();
  const [storageData, setStorageData] = useState<StorageData[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchAllStorageData();
  }, []);

  const fetchAllStorageData = async () => {
    try {
      // 1. TÜM ANAHTARLARI AL - HİÇBİRİNİ ATLAMA
      const allKeys = await AsyncStorage.getAllKeys();

      const allData: StorageData[] = [];

      // 2. HER ANAHTARI TEK TEK OKU - GARANTİLİ
      for (const key of allKeys) {
        try {
          const rawValue = await AsyncStorage.getItem(key);
          
          let parsedValue = rawValue;
          let parseSuccess = false;
          
          // JSON parse etmeyi dene
          if (rawValue !== null && rawValue !== undefined) {
            try {
              parsedValue = JSON.parse(rawValue);
              parseSuccess = true;
            } catch (parseError) {
              parseSuccess = false;
              parsedValue = rawValue;
            }
          }

          // HER ŞEYİ EKLE - HİÇBİR FİLTRE YOK
          allData.push({
            title: `${key} ${parseSuccess ? '(JSON)' : '(STRING)'}`,
            key: key,
            data: parsedValue
          });
          
        } catch (error) {
          // HATA OLSA BİLE EKLEYELİM
          allData.push({
            title: `${key} (ERROR)`,
            key: key,
            data: `HATA: ${error}`
          });
        }
      }

      // 3. SIRAYLA GÖSTER - ALFABETIK
      allData.sort((a, b) => a.title.localeCompare(b.title));

      setStorageData(allData);
      
      // TEKİL UUID'yi de kontrol et
      try {
        const { storage } = require('../../services/storage');
        const currentUUID = await storage.getUserUUID();
      } catch (uuidError) {
      }
      
    } catch (error) {
      showToast('error', `HATA: ${error}`);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchAllStorageData();
    setRefreshing(false);
  };

     const copyToClipboard = async (data: any, title: string) => {
     try {
       await Clipboard.setString(JSON.stringify(data, null, 2));
       showToast('success', `${title} ${t('developer_copy')}`);
     } catch (error) {
       showToast('error', t('developer_copy_failed'));
     }
   };

   const refreshUserProfile = async () => {
     try {
       setLoading(true);
       const response = await getUserInfo();
       
       if (response.error) {
         showToast('error', `${t('developer_api_error')}: ${response.error}`);
       } else {
         showToast('success', t('developer_profile_refreshed'));
         await fetchAllStorageData(); // Verileri yeniden yükle
       }
     } catch (error) {
       console.error('Profile refresh error:', error);
       showToast('error', t('developer_profile_refresh_error'));
     } finally {
       setLoading(false);
     }
   };

   const clearStorageItem = async (key: string) => {
     try {
       await AsyncStorage.removeItem(key);
       showToast('success', `${key} ${t('developer_delete')}`);
       await fetchAllStorageData();
     } catch (error) {
       console.error('Clear storage error:', error);
       showToast('error', t('developer_clear_error'));
     }
   };

   const clearAllStorage = async () => {
     try {
       await AsyncStorage.clear();
       showToast('success', t('developer_all_cleared'));
       await fetchAllStorageData();
     } catch (error) {
       console.error('Clear all storage error:', error);
       showToast('error', t('developer_clear_all_error'));
     }
   };

  const StorageCard = ({ item }: { item: StorageData }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editedData, setEditedData] = useState('');
    const [viewMode, setViewMode] = useState<'text' | 'json'>('text');

    const handleEdit = () => {
      setEditedData(JSON.stringify(item.data, null, 2));
      setIsEditing(true);
    };

    const handleSave = async () => {
      try {
        const parsedData = JSON.parse(editedData);
        
        // AsyncStorage'a direkt kaydet
        await AsyncStorage.setItem(item.key, JSON.stringify(parsedData));

                 showToast('success', t('developer_data_updated'));
         setIsEditing(false);
         fetchAllStorageData();
       } catch (error) {
         showToast('error', t('developer_invalid_json'));
      }
    };

    const formatJSON = (data: any): string => {
      if (typeof data !== 'object' || data === null) {
        return String(data);
      }
      
      try {
        return JSON.stringify(data, null, 2)
          .replace(/\\n/g, '\n')
          .replace(/\\"/g, '"')
          .replace(/\\/g, '')
          .replace(/,/g, ',')
          .replace(/{/g, '{')
          .replace(/}/g, '}')
          .replace(/\[/g, '[')
          .replace(/\]/g, ']');
      } catch (e) {
        return String(data);
      }
    };

    const toggleViewMode = () => {
      setViewMode(viewMode === 'text' ? 'json' : 'text');
    };

    return (
      <View style={[styles.storageCard, { 
        backgroundColor: colors.card,
        borderColor: colors.cardBorder
      }]}>
        <View style={styles.storageCardHeader}>
          <Text style={[styles.storageTitle, { color: colors.text }]}>{item.title}</Text>
          <View style={styles.buttonContainer}>
            {isEditing ? (
              <>
                <TouchableOpacity 
                  onPress={handleSave}
                  style={[styles.button, styles.saveButton]}
                >
                  <Text style={styles.buttonText}>{t('developer_save')}</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  onPress={() => setIsEditing(false)}
                  style={[styles.button, styles.cancelButton]}
                >
                  <Text style={styles.buttonText}>{t('developer_cancel')}</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <TouchableOpacity 
                  onPress={toggleViewMode}
                  style={[styles.button, { backgroundColor: '#6366F1' }]}
                >
                  <Text style={styles.buttonText}>
                    {viewMode === 'text' ? t('developer_json_view') : t('developer_text_view')}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  onPress={handleEdit}
                  style={[styles.button, styles.editButton]}
                >
                  <Text style={styles.buttonText}>{t('developer_edit')}</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  onPress={() => copyToClipboard(item.data, item.title)}
                  style={[styles.button, styles.copyButton]}
                >
                  <Text style={styles.buttonText}>{t('developer_copy')}</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  onPress={() => clearStorageItem(item.key)}
                  style={[styles.button, styles.deleteButton]}
                >
                  <Text style={styles.buttonText}>{t('developer_delete')}</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
        <ScrollView 
          style={[styles.dataContainer, { backgroundColor: colors.surface }]}
          nestedScrollEnabled={true}
        >
          {isEditing ? (
            <TextInput
              style={[styles.dataInput, { color: colors.textSecondary }]}
              multiline
              value={editedData}
              onChangeText={setEditedData}
            />
          ) : viewMode === 'text' ? (
            <Text style={[styles.dataText, { color: colors.textSecondary }]}>
              {formatJSON(item.data)}
            </Text>
          ) : (
            <View style={styles.jsonViewerContainer}>
              <JSONViewer data={item.data} />
            </View>
          )}
        </ScrollView>
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar
        barStyle={currentTheme === 'dark' ? 'light-content' : 'dark-content'}
        backgroundColor={colors.headerBackground}
      />
      <View style={[styles.header, { 
        backgroundColor: colors.headerBackground,
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
        <View style={styles.titleContainer}>
          <Text style={[styles.headerTitle, { color: colors.headerText }]}>{t('developer_title')}</Text>
        </View>
        <View style={styles.backButton} />
      </View>

      <ScrollView 
        style={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
      >
        <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('developer_storage_data')}</Text>
        <Text style={[styles.description, { color: colors.textSecondary }]}>
          {t('developer_storage_description')}
        </Text>
        
        <View style={[styles.statsContainer, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
                     <Text style={[styles.statsText, { color: colors.text }]}>
             {`${t('developer_total_items').replace('{count}', storageData.length.toString())}`}
           </Text>
        </View>
        
                {storageData.map((item, index) => (
          <StorageCard key={index} item={item} />
        ))}
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
    width: 40,
  },
  titleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    fontFamily: 'Outfit',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 8,
    fontFamily: 'Outfit',
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 24,
    fontFamily: 'Outfit',
  },
  statsContainer: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    alignItems: 'center',
  },
  statsText: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Outfit',
  },
  storageCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  storageCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    flexWrap: 'wrap',
  },
  storageTitle: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
    marginRight: 8,
    fontFamily: 'Outfit',
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 4,
    flexWrap: 'wrap',
  },
  button: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginBottom: 4,
  },
  buttonText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#FFFFFF',
    fontFamily: 'Outfit',
  },
  editButton: {
    backgroundColor: '#3B82F6',
  },
  copyButton: {
    backgroundColor: '#E11D48',
  },
  deleteButton: {
    backgroundColor: '#DC2626',
  },
  saveButton: {
    backgroundColor: '#16A34A',
  },
  cancelButton: {
    backgroundColor: '#6B7280',
  },
  dataContainer: {
    maxHeight: 200,
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
  },
  dataText: {
    fontSize: 12,
    fontFamily: 'monospace',
    lineHeight: 16,
  },
  dataInput: {
    fontFamily: 'monospace',
    fontSize: 12,
    lineHeight: 16,
    padding: 0,
  },
  apiToolsContainer: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
  },
  apiToolTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
    fontFamily: 'Outfit',
  },
  apiToolDescription: {
    fontSize: 14,
    marginBottom: 16,
    lineHeight: 20,
    fontFamily: 'Outfit',
  },
  apiButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  apiButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 16,
    fontFamily: 'Outfit',
  },
  jsonViewerContainer: {
    padding: 4,
  },
  jsonKey: {
    fontFamily: 'monospace',
    fontWeight: '600',
  },
  jsonString: {
    fontFamily: 'monospace',
  },
  jsonNumber: {
    fontFamily: 'monospace',
  },
  jsonBoolean: {
    fontFamily: 'monospace',
    fontWeight: '600',
  },
  jsonNull: {
    fontFamily: 'monospace',
    fontStyle: 'italic',
  },
  jsonUndefined: {
    fontFamily: 'monospace',
    fontStyle: 'italic',
  },
});

export default DeveloperResourcesScreen; 