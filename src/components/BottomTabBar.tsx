import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SvgXml } from 'react-native-svg';
import { NavigationProp } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';
import { useUser } from '../context/UserContext';
import { useTranslation } from 'react-i18next';

interface TabRoute {
  key: string;
  name: string;
}

interface TabBarState {
  index: number;
  routes: TabRoute[];
}

interface BottomTabBarProps {
  state: TabBarState;
  navigation: NavigationProp<any>;
}

const homeIcon = `
<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M3 9L12 2L21 9V20C21 20.5304 20.7893 21.0391 20.4142 21.4142C20.0391 21.7893 19.5304 22 19 22H5C4.46957 22 3.96086 21.7893 3.58579 21.4142C3.21071 21.0391 3 20.5304 3 20V9Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M9 22V12H15V22" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
</svg>
`;

const workoutIcon = `
<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M6 12H18M4 8V16M20 8V16M2 10V14M22 10V14" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
</svg>
`;

const statsIcon = `
<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M21 21H3V3" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M7 14L12 9L16 13L21 8" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M21 12V8H17" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
</svg>
`;



const profileIcon = `
<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M20 21V19C20 17.9391 19.5786 16.9217 18.8284 16.1716C18.0783 15.4214 17.0609 15 16 15H8C6.93913 15 5.92172 15.4214 5.17157 16.1716C4.42143 16.9217 4 17.9391 4 19V21" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M12 11C14.2091 11 16 9.20914 16 7C16 4.79086 14.2091 3 12 3C9.79086 3 8 4.79086 8 7C8 9.20914 9.79086 11 12 11Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
</svg>
`;

const getIcon = (routeName: string, isFocused: boolean, colors: any) => {
  const color = isFocused ? colors.tabBarActive : colors.tabBarInactive;
  
  switch (routeName) {
    case 'Home':
      return homeIcon.replace(/currentColor/g, color);
    case 'Workout':
      return workoutIcon.replace(/currentColor/g, color);
    case 'Stats':
      return statsIcon.replace(/currentColor/g, color);
    case 'Profile':
      return profileIcon.replace(/currentColor/g, color);
    default:
      return homeIcon.replace(/currentColor/g, color);
  }
};

const BottomTabBar: React.FC<BottomTabBarProps> = ({ state, navigation }) => {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { user_role_id } = useUser();
  const { t } = useTranslation();

  const getTabLabel = (routeName: string) => {
    switch (routeName) {
      case 'Home':
        return t('nav_home');
      case 'Workout':
        return t('nav_workout');
      case 'Stats':
        return t('nav_stats');
      case 'Profile':
      case 'ProfileDetails':
        return t('nav_profile');
      default:
        return routeName;
    }
  };

  const renderTab = (route: TabRoute, index: number) => {
    const currentRoute = state.routes && state.routes[state.index];
    const isFocused = user_role_id === 1 && route.name === 'ProfileDetails' ? 
      currentRoute?.name === 'ProfileDetails' : 
      state.index === index;
    const icon = getIcon(route.name === 'ProfileDetails' ? 'Profile' : route.name, isFocused, colors);

    const onPress = () => {
      if (!isFocused) {
        navigation.navigate(route.name as never);
      }
    };

    return (
      <TouchableOpacity
        key={route.key}
        onPress={onPress}
        style={[styles.tab, isFocused && styles.tabFocused]}
      >
        {typeof icon === 'string' ? (
          <SvgXml xml={icon} width={24} height={24} />
        ) : (
          icon
        )}
        <Text style={[
          styles.label, 
          { color: colors.tabBarInactive },
          isFocused && { color: colors.tabBarActive }
        ]}>
          {getTabLabel(route.name)}
        </Text>
      </TouchableOpacity>
    );
  };

  const filteredRoutes = (state.routes || []).filter((route: TabRoute) => {
    if (route.name === 'ProfileDetails' && user_role_id === 0) {
      return false;
    }
    if (route.name === 'Profile' && user_role_id === 1) {
      return false;
    }
    return true;
  });

  return (
    <View style={[
      styles.container,
      {
        backgroundColor: colors.tabBar,
        borderTopColor: colors.tabBarBorder,
        paddingBottom: Math.max(insets.bottom, 20),
      }
    ]}>
      {filteredRoutes.map((route, index) => renderTab(route, index))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    borderTopWidth: 1,
    paddingTop: 12,
    paddingHorizontal: 20,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  tabFocused: {
    // Add styles for focused tab
  },
  label: {
    fontSize: 12,
    marginTop: 4,
    fontWeight: '500',
  },
});

export default BottomTabBar; 