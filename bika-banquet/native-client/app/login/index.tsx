import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, SafeAreaView, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../store/authStore';
import Toast from 'react-native-toast-message';
import { getDefaultDashboardRoute } from '../../lib/routeAccess';

export default function LoginPage() {
    const router = useRouter();
    const { login, loadUser, isLoading } = useAuthStore();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const handleSubmit = async () => {
        try {
            const normalizedEmail = email.trim().toLowerCase();
            const normalizedPassword = password;

            if (!normalizedEmail || !normalizedPassword) {
                Toast.show({ type: 'error', text1: 'Missing fields', text2: 'Please enter both email and password.' });
                return;
            }

            await login(normalizedEmail, normalizedPassword);
            const loggedInUser = useAuthStore.getState().user;
            const nextRoute = getDefaultDashboardRoute(loggedInUser?.permissions);

            if (!nextRoute) {
                await useAuthStore.getState().logout();
                Toast.show({ type: 'error', text1: 'No access', text2: 'No module access is assigned to this user.' });
                return;
            }

            Toast.show({
                type: 'success',
                text1: 'Login successful!',
                visibilityTime: 1200,
                autoHide: true,
            });

            // Refresh profile in background, but don't block successful login navigation.
            loadUser().catch(() => undefined);

            // Replace removes login screen from the back-stack history
            // Expo app only has a single dashboard webview route.
            const targetRoute = nextRoute.startsWith('/dashboard')
                ? '/dashboard'
                : nextRoute;
            router.replace(targetRoute as any);
            setTimeout(() => {
                Toast.hide();
            }, 1300);
        } catch (error: any) {
            const message =
                error?.response?.data?.error ||
                error?.response?.data?.message ||
                (error?.response?.status === 429 ? 'Too many login attempts.' : null) ||
                (error?.message === 'Network Error'
                    ? 'Network error. Verify internet access and SSL for banquet.bikafood.com.'
                    : null) ||
                'Login failed';
            Toast.show({ type: 'error', text1: 'Error', text2: message });
        }
    };

    return (
        <SafeAreaView className="flex-1 bg-gray-50">
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                className="flex-1"
            >
                <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 24 }}>
                    <View className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
                        <View className="mb-8 items-center">
                            <View className="bg-teal-50 px-3 py-1 rounded-full mb-4">
                                <Text className="text-xs font-semibold text-teal-700">Hospitality Operations Suite</Text>
                            </View>
                            <Text className="text-4xl font-bold text-gray-900 mb-2 text-center">Bika Banquet</Text>
                            <Text className="text-gray-500 text-center">Access your operations dashboard.</Text>
                        </View>

                        <View className="gap-4">
                            <View>
                                <Text className="text-sm font-medium text-gray-700 mb-2">Email Address</Text>
                                <TextInput
                                    value={email}
                                    onChangeText={setEmail}
                                    autoCapitalize="none"
                                    keyboardType="email-address"
                                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-900"
                                    placeholder="admin@bikabanquet.com"
                                    placeholderTextColor="#9ca3af"
                                />
                            </View>

                            <View>
                                <Text className="text-sm font-medium text-gray-700 mb-2">Password</Text>
                                <TextInput
                                    value={password}
                                    onChangeText={setPassword}
                                    secureTextEntry
                                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-900"
                                    placeholder="••••••••"
                                    placeholderTextColor="#9ca3af"
                                />
                            </View>

                            <TouchableOpacity
                                onPress={handleSubmit}
                                disabled={isLoading}
                                className={`w-full py-4 rounded-xl mt-4 items-center ${isLoading ? 'bg-teal-400' : 'bg-teal-600'}`}
                            >
                                <Text className="text-white font-semibold text-base">
                                    {isLoading ? 'Signing in...' : 'Sign In'}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}
