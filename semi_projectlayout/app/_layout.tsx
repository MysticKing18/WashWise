import { Stack } from "expo-router";
import * as NavigationBar from "expo-navigation-bar";
import { useEffect } from "react";
import { Platform } from "react-native";

export default function RootLayout() {
  useEffect(() => {
    if (Platform.OS !== "android") return;

    NavigationBar.setVisibilityAsync("hidden");
  }, []);

  return <Stack screenOptions={{ headerShown: false }} />; 
}
