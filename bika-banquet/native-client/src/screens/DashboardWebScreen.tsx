import React, { useMemo } from 'react';
import { SafeAreaView, ActivityIndicator, View, StatusBar } from 'react-native';
import { WebView } from 'react-native-webview';

const DEFAULT_WEB_URL = 'https://banquet.bikafood.com';

export default function DashboardWebScreen() {
  const uri = useMemo(
    () => process.env.EXPO_PUBLIC_WEB_URL || DEFAULT_WEB_URL,
    []
  );

  return (
    <SafeAreaView className="flex-1 bg-white">
      <StatusBar barStyle="dark-content" />
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
