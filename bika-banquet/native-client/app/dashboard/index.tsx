import React, { useMemo } from 'react';
import { SafeAreaView, ActivityIndicator, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { WebView } from 'react-native-webview';

const DEFAULT_WEB_URL = 'https://banquet.bikafood.com';

export default function DashboardWeb() {
  const uri = useMemo(
    () => process.env.EXPO_PUBLIC_WEB_URL || DEFAULT_WEB_URL,
    []
  );

  return (
    <SafeAreaView className="flex-1 bg-white">
      <StatusBar style="dark" />
      <WebView
        source={{ uri }}
        startInLoadingState
        renderLoading={() => (
          <View className="flex-1 items-center justify-center bg-white">
            <ActivityIndicator size="large" color="#0d9488" />
          </View>
        )}
        allowsBackForwardNavigationGestures
      />
    </SafeAreaView>
  );
}
