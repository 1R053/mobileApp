import { NavigationContainer, NavigationProp } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import React, { useEffect, useState } from 'react';
import * as SecureStore from 'expo-secure-store';
import { ActivityIndicator, View } from 'react-native';
import { WelcomeScreen } from './src/screens/welcome.screen';
import { CreatorCoinHODLer, EventType, ToggleProfileManagerEvent, User } from './src/types';
import { settingsGlobals } from './src/globals/settingsGlobals';
import { themeStyles, updateThemeStyles } from './styles/globalColors';
import { globals } from './src/globals/globals';
import { constants } from './src/globals/constants';
import { AppNavigator } from './src/navigation/appNavigator';
import { SnackbarComponent } from './src/components/snackbarComponent';
import { cache, initCache } from './src/services/dataCaching/cache';
import { notificationsService } from './src/services/notificationsService';
import { LoginNavigator } from './src/navigation/loginNavigator';
import { ActionSheet } from './src/components/actionSheet.component';
import { DiamondAnimationComponent } from '@components/diamondAnimation.component';
import { cloutFeedApi } from '@services/cloutfeedApi';
import { enableScreens } from 'react-native-screens';
import { signing } from '@services/authorization/signing';
import { authentication } from '@services/authorization/authentication';
import { ProfileManagerComponent } from '@components/profileManager.component';
import { eventManager } from '@globals/injector';
import { StatusBar } from 'expo-status-bar';

enableScreens();

const Stack = createStackNavigator();

export default function App() {
  const [isLoading, setLoading] = useState(true);
  const [isLoggedIn, setLoggedIn] = useState(false);
  const [areTermsAccepted, setTermsAccepted] = useState(false);
  const [theme, setGlobalTheme] = useState('light');
  const [showProfileManager, setShowProfileManager] = useState(false);
  const [navigation, setNavigation] = useState<NavigationProp<any>>();

  let mount = true;

  useEffect(
    () => {
      checkAuthenticatedUser();
      const unsubscribe = eventManager.addEventListener(
        EventType.ToggleProfileManager,
        (event: ToggleProfileManagerEvent) => {
          if (mount) {
            setShowProfileManager(event.visible);
            setNavigation(event.navigation);
          }
        }
      );

      return () => {
        unsubscribe();
      };
    },
    []
  );

  async function checkAuthenticatedUser() {
    SecureStore.getItemAsync(constants.localStorage_publicKey).then(
      async p_publicKey => {

        if (p_publicKey) {
          const cloutFeedIdentity = await SecureStore.getItemAsync(constants.localStorage_cloutFeedIdentity);

          if (cloutFeedIdentity) {
            globals.user.publicKey = p_publicKey;
            const readonlyValue = await SecureStore.getItemAsync(constants.localStorage_readonly);
            globals.readonly = readonlyValue !== 'false';
            globals.onLoginSuccess();
          } else {
            await SecureStore.deleteItemAsync(constants.localStorage_publicKey);
            await SecureStore.deleteItemAsync(constants.localStorage_readonly);

            if (mount) {
              setTermsAccepted(true);
              setLoading(false);
            }
          }
        } else {
          const termsAccepted = await SecureStore.getItemAsync(constants.localStorage_termsAccepted);

          if (mount) {
            setTermsAccepted(termsAccepted === 'true');
            setLoading(false);
          }
        }
      }
    ).catch(() => { });
  }

  globals.acceptTermsAndConditions = () => {
    if (mount) {
      setTermsAccepted(true);
    }
  };

  globals.setGlobalTheme = (p_theme: string) => {
    setGlobalTheme(p_theme);
  }

  globals.onLoginSuccess = async () => {
    cache.user.reset();
    if (mount) {
      setLoading(true);
    }

    Promise.all(
      [
        cache.user.getData()
      ]
    ).then(
      async p_responses => {
        setInvestorFeatures(p_responses[0]);
        setFollowerFeatures(p_responses[0]);

        globals.user.username = p_responses[0].ProfileEntryResponse?.Username;

        if (globals.readonly === false) {
          notificationsService.registerPushToken().catch(() => { });
        }

        initCache();
        await setTheme();
      }
    ).catch(() => { })
      .finally(
        () => {
          if (mount) {
            setLoggedIn(true);
            setTermsAccepted(true);
            setLoading(false);
          }
        }
      );
  }

  globals.onLogout = async () => {
    setLoading(true);
    await SecureStore.deleteItemAsync(constants.localStorage_publicKey);
    await SecureStore.deleteItemAsync(constants.localStorage_readonly);

    if (globals.readonly === false) {
      const jwt = await signing.signJWT();
      cloutFeedApi.unregisterNotificationsPushToken(globals.user.publicKey, jwt).catch(() => { });
      await authentication.removeAuthenticatedUser(globals.user.publicKey);

      const loggedInPublicKeys = await authentication.getAuthenticatedUserPublicKeys();

      if (loggedInPublicKeys?.length > 0) {
        const publicKey = loggedInPublicKeys[0];
        await SecureStore.setItemAsync(constants.localStorage_publicKey, publicKey);
        await SecureStore.setItemAsync(constants.localStorage_readonly, 'false');
        globals.user = { publicKey, username: '' };
        globals.readonly = false;
        globals.onLoginSuccess();
        return;
      }
    }

    globals.user.publicKey = '';
    globals.investorFeatures = false;
    globals.followerFeatures = false;
    globals.readonly = true;

    if (mount) {
      setLoggedIn(false);
      setTermsAccepted(true);
      setLoading(false);
    }
    cache.user.reset();
  };

  function setInvestorFeatures(p_user: User) {
    globals.investorFeatures = true;

    const usersYouHODL = p_user.UsersYouHODL as CreatorCoinHODLer[];

    const cloutFeedCoin = usersYouHODL?.find(p_user => p_user.CreatorPublicKeyBase58Check === constants.cloutfeed_publicKey);

    if ((cloutFeedCoin && cloutFeedCoin.BalanceNanos > 30000000) || p_user.PublicKeyBase58Check === constants.cloutfeed_publicKey) {
      cloutFeedCoin?.BalanceNanos
      globals.investorFeatures = true;
    }
  }

  function setFollowerFeatures(p_user: User) {
    globals.followerFeatures = globals.user.publicKey === constants.cloutfeed_publicKey;

    const followedByUserPublicKeys = p_user.PublicKeysBase58CheckFollowedByUser as string[];

    if (followedByUserPublicKeys?.length > 0 && followedByUserPublicKeys.indexOf(constants.cloutfeed_publicKey) !== -1) {
      globals.followerFeatures = true;
    }
  }

  async function setTheme() {
    settingsGlobals.darkMode = false;

    if (globals.followerFeatures) {
      const key = globals.user.publicKey + constants.localStorage_appearance;
      const theme = await SecureStore.getItemAsync(key);
      settingsGlobals.darkMode = theme === 'dark';
    }
    updateThemeStyles();
  }

  return isLoading ?
    <View style={[{ flex: 1 }, themeStyles.containerColorMain]}>
      <ActivityIndicator style={{ marginTop: 200 }} color={themeStyles.fontColorMain.color} />
    </View>
    :
    <NavigationContainer>
      <StatusBar style={settingsGlobals.darkMode ? 'light' : 'dark'} hidden={false}/>
      <Stack.Navigator>
        {
          !isLoggedIn ?
            areTermsAccepted ?
              <Stack.Screen
                options={{
                  headerShown: false
                }}
                name="LoginNavigator" component={LoginNavigator} />
              :
              <Stack.Screen name="Welcome" component={WelcomeScreen} />
            :
            <Stack.Screen
              name="AppNavigator"
              component={AppNavigator}
              options={{
                headerShown: false,
              }}
            />
        }
      </Stack.Navigator >
      <DiamondAnimationComponent></DiamondAnimationComponent>
      <ActionSheet></ActionSheet>
      <SnackbarComponent></SnackbarComponent>
      {
        showProfileManager ?
          <ProfileManagerComponent navigation={navigation as NavigationProp<any>}></ProfileManagerComponent> : undefined
      }
    </NavigationContainer >
    ;
}
