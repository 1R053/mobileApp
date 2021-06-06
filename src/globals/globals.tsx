import * as Network from 'expo-network';
import { Alert } from 'react-native';

export const globals = {
    user: { publicKey: '', username: '' },
    acceptTermsAndConditions: () => { },
    onLoginSuccess: () => { },
    onLogout: (p_jwt?: string) => { },
    createPost: () => { },
    tickers: { USD: { last: 0 } },
    exchangeRate: { SatoshisPerBitCloutExchangeRate: 0 },
    investorFeatures: false,
    followerFeatures: false,
    setGlobalTheme: (p_theme: string) => { },
    pushNotificationsToken: '',
    readonly: true,
    identityBaseUrl: 'https://cloutfeed.app',
    identityVersion: '1',
    defaultHandleError: (p_error: any) => {
        if (p_error?.status === 429) {
            Alert.alert('Error', 'BitClout is experiencing heavy load. Please try again in one minute.');
        } else {
            Network.getNetworkStateAsync().then(
                p_state => {
                    if (p_state.isConnected) {
                        Alert.alert('Error', 'Something went wrong! Please try again in one minute.');
                    } else {
                        Alert.alert('Error', 'No internet connection.');
                    }
                }
            ).catch(() => Alert.alert('Error', 'Something went wrong! Please try again later.'));
        }
    }
}