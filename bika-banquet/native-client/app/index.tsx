import { View, Text, Pressable } from "react-native";
import { Link } from "expo-router";
import { StatusBar } from "expo-status-bar";

export default function Index() {
    return (
        <View className="flex-1 items-center justify-center bg-white p-6">
            <Text className="text-4xl font-bold text-teal-600 mb-2 text-center">Bika Banquet</Text>
            <Text className="text-lg text-gray-500 mb-10 text-center">Native Operations Suite</Text>

            <Link href="/login" asChild>
                <Pressable className="bg-teal-600 px-8 py-4 rounded-xl shadow-sm w-full max-w-sm active:bg-teal-700">
                    <Text className="text-white font-semibold text-lg text-center">Sign In</Text>
                </Pressable>
            </Link>
            <StatusBar style="dark" />
        </View>
    );
}
