import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { TabParamList } from './types';
import { LibraryScreen } from '../screens/tabs/LibraryScreen';
import { SearchScreen } from '../screens/tabs/SearchScreen';
import { WishlistScreen } from '../screens/tabs/WishlistScreen';
import { HunterScreen } from '../screens/tabs/HunterScreen';
import { AlertsScreen } from '../screens/tabs/AlertsScreen';
import { colors, fonts, fontSizes } from '../theme';

const Tab = createBottomTabNavigator<TabParamList>();

export function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.line,
          borderTopWidth: 1,
        },
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.muted,
        tabBarLabelStyle: {
          fontFamily: fonts.ui,
          fontSize: fontSizes.xs,
        },
      }}
    >
      <Tab.Screen name="Library" component={LibraryScreen} options={{ tabBarLabel: 'Biblioteca' }} />
      <Tab.Screen name="Search" component={SearchScreen} options={{ tabBarLabel: 'Buscar' }} />
      <Tab.Screen name="Wishlist" component={WishlistScreen} options={{ tabBarLabel: 'Wishlist' }} />
      <Tab.Screen name="Hunter" component={HunterScreen} options={{ tabBarLabel: 'Hunter' }} />
      <Tab.Screen name="Alerts" component={AlertsScreen} options={{ tabBarLabel: 'Alertas' }} />
    </Tab.Navigator>
  );
}
