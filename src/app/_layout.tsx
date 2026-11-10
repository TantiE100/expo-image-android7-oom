import { Tabs } from 'expo-router';

export default function Layout() {
  return (
    <Tabs screenOptions={{ headerShown: false, tabBarIcon: () => null, tabBarLabelStyle: { fontSize: 14 } }}>
      <Tabs.Screen name="index" options={{ title: 'Shelf' }} />
      <Tabs.Screen name="courses" options={{ title: 'Feed' }} />
      <Tabs.Screen name="paths" options={{ title: 'Gallery' }} />
    </Tabs>
  );
}
