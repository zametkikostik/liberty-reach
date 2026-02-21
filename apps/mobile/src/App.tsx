import React from 'react';
import {ThemeProvider} from '@liberty-reach/ui';
import {NavigationContainer} from '@react-navigation/native';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import {GestureHandlerRootView} from 'react-native-gesture-handler';
import RootNavigator from './navigation/RootNavigator';
import {StoreProvider} from './store/StoreProvider';

function App(): React.JSX.Element {
  return (
    <GestureHandlerRootView style={{flex: 1}}>
      <ThemeProvider defaultTheme="light">
        <SafeAreaProvider>
          <StoreProvider>
            <NavigationContainer>
              <RootNavigator />
            </NavigationContainer>
          </StoreProvider>
        </SafeAreaProvider>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}

export default App;
