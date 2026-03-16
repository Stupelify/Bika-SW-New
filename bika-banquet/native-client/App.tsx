import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Toast from 'react-native-toast-message';
import LoginScreen from './src/screens/LoginScreen';
import DashboardWebScreen from './src/screens/DashboardWebScreen';

export type RootStackParamList = {
  Login: undefined;
  Dashboard: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Login"
        screenOptions={{ headerShown: false }}
      >
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Dashboard" component={DashboardWebScreen} />
      </Stack.Navigator>
      <Toast
        visibilityTime={1400}
        autoHide
        onShow={() => {
          setTimeout(() => Toast.hide(), 1500);
        }}
      />
    </NavigationContainer>
  );
}
