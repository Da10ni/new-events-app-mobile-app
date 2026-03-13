import './global.css';
import { ActivityIndicator, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Provider } from 'react-redux';
import { useFonts } from 'expo-font';
import { Ionicons } from '@expo/vector-icons';
import { store } from './src/store';
import RootNavigator from './src/navigation/RootNavigator';
import { SweetAlertProvider } from './src/components/feedback';

export default function App() {
  const [fontsLoaded] = useFonts({
    ...Ionicons.font,
  });

  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Provider store={store}>
        <SafeAreaProvider>
          <SweetAlertProvider>
            <RootNavigator />
            <StatusBar style="auto" />
          </SweetAlertProvider>
        </SafeAreaProvider>
      </Provider>
    </GestureHandlerRootView>
  );
}
