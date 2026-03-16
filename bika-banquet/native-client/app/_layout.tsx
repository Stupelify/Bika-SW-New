import { Stack } from "expo-router";
import Toast from 'react-native-toast-message';
import "../global.css";

export default function RootLayout() {
    return (
        <>
            <Stack>
                <Stack.Screen name="index" options={{ headerShown: false }} />
                <Stack.Screen name="login/index" options={{ headerShown: false }} />
                <Stack.Screen name="dashboard/index" options={{ headerShown: false }} />
            </Stack>
            <Toast
                visibilityTime={1400}
                autoHide
                onShow={() => {
                    setTimeout(() => Toast.hide(), 1500);
                }}
            />
        </>
    );
}
