import React, { useEffect, useState } from 'react';
import { View, StyleSheet, TextInput, TouchableOpacity, Text, Image, Keyboard, Alert } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import Clipboard from 'expo-clipboard';
import { constants, globals } from '@globals';
import { api } from '@services';
import { Profile } from '@types';

export function LoginScreen({ navigation }: any) {
    const [username, setUsername] = useState('');
    const [isLogoVisible, setLogoVisible] = useState(true);
    const [loginWithUsername, setLoginWithUsername] = useState(false);
    const [working, setWorking] = useState(false);
    let mount = true;

    useEffect(
        () => {
            checkCloutFeedIdentity();
            Keyboard.addListener("keyboardDidShow", keyboardDidShow);
            Keyboard.addListener("keyboardDidHide", keyboardDidHide);

            return () => {
                Keyboard.removeListener("keyboardDidShow", keyboardDidShow);
                Keyboard.removeListener("keyboardDidHide", keyboardDidHide);
                mount = false;
            };
        },
        []
    );

    async function checkCloutFeedIdentity() {
        const cloutFeedIdentity = await SecureStore.getItemAsync(constants.localStorage_cloutFeedIdentity);

        if (!cloutFeedIdentity) {
            navigation.navigate('IdentityInfo');
            await SecureStore.setItemAsync(constants.localStorage_cloutFeedIdentity, 'true');
        }
    }

    async function onPasteAndLogin() {
        if (mount) {
            setWorking(true);
        }

        try {
            await Clipboard.getStringAsync().then(
                async p_username => {
                    if (p_username) {
                        setUsername(p_username);
                        await onLogin(p_username);
                    } else {
                        Alert.alert('Error', 'Username is empty.');
                        if (mount) {
                            setWorking(false);
                        }
                    }
                }
            );
        } catch {
            if (mount) {
                setWorking(false);
            }
            alert('Something went wrong!');
        }
    }

    const onLogin = async (p_username?: string) => {
        let loggedIn = false;

        try {
            p_username = p_username ? p_username : username;
            p_username = p_username.trim();

            if (!p_username) {
                return;
            }

            if (mount) {
                setWorking(true);
            }

            const response = await api.searchProfiles('', p_username, 10);
            const profiles = response.ProfilesFound as Profile[];

            if (profiles?.length > 0) {
                const profile = profiles.find(p_profile => p_profile.Username.toLocaleLowerCase() === username.toLocaleLowerCase());

                if (profile) {
                    const publicKey = profile.PublicKeyBase58Check;
                    await SecureStore.setItemAsync(constants.localStorage_publicKey, publicKey);
                    await SecureStore.setItemAsync(constants.localStorage_readonly, 'true');

                    globals.user = { publicKey: publicKey, username: profile.Username };
                    globals.readonly = true;
                    globals.onLoginSuccess();
                    loggedIn = true;
                }
            }

            if (!loggedIn) {
                Alert.alert('Error', 'Profile not found.');
            }

        } catch (p_error) {
            globals.defaultHandleError(p_error);
        }

        if (mount && !loggedIn) {
            setUsername('');
            setWorking(false);
        }
    }

    const keyboardDidShow = () => setLogoVisible(false);
    const keyboardDidHide = () => setLogoVisible(true);

    function onTextChange(p_value: string) {
        if (mount) {
            setUsername(p_value)
        }
    }

    return (
        <View style={styles.container}>
            <Image style={[styles.logo, { height: isLogoVisible ? 120 : 0 }]} source={require('../../../assets/icon-black.png')}></Image>
            <Text style={styles.title}>CloutFeed</Text>
            <Text style={styles.subtitle}>Powered by BitClout</Text>
            {
                loginWithUsername ?
                    <View style={styles.loginOptionsContainer}>

                        <TextInput
                            style={styles.input}
                            placeholder='Enter your username...'
                            value={username}
                            onChangeText={onTextChange}
                            placeholderTextColor={'#b0b3b8'}
                            keyboardAppearance={'dark'}
                        />

                        {
                            !username ?
                                <TouchableOpacity
                                    style={[styles.loginButton, { marginBottom: 10, backgroundColor: working ? '#999999' : 'black' }]}
                                    onPress={onPasteAndLogin} disabled={working}
                                    activeOpacity={1}
                                >
                                    <Text style={styles.loginButtonText}>Paste & Login</Text>
                                </TouchableOpacity>
                                :
                                <TouchableOpacity
                                    style={[styles.loginButton, { marginBottom: 10, backgroundColor: working ? '#999999' : 'black' }]}
                                    onPress={() => onLogin()} disabled={working}
                                    activeOpacity={1}
                                >
                                    <Text style={styles.loginButtonText}>Login</Text>
                                </TouchableOpacity>
                        }

                        <TouchableOpacity style={styles.backButton} onPress={() => setLoginWithUsername(false)} disabled={working}>
                            <Text style={styles.modeText}>Back</Text>
                        </TouchableOpacity>
                    </View>
                    :
                    <View style={styles.loginOptionsContainer}>

                        <Text style={styles.modeText}>Read-Only Mode</Text>
                        <TouchableOpacity
                            style={[styles.loginButton]}
                            onPress={() => setLoginWithUsername(true)}
                            activeOpacity={1}
                        >
                            <Text style={styles.loginButtonText}>Login with Username</Text>
                        </TouchableOpacity>

                        <Text style={styles.modeText}>Full Access Mode</Text>
                        <TouchableOpacity
                            style={[styles.loginButton, { marginBottom: 10 }]}
                            onPress={() => navigation.navigate('Identity')}
                            activeOpacity={1}
                        >
                            <Text style={styles.loginButtonText}>Login with CloutFeed Identity</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.backButton} onPress={() => navigation.navigate('IdentityInfo')} disabled={working}>
                            <Text style={styles.modeText}>Read more</Text>
                        </TouchableOpacity>
                    </View>
            }
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#121212',
        alignItems: 'center'
    },
    input: {
        borderWidth: 1,
        borderColor: '#777',
        paddingTop: 16,
        paddingBottom: 16,
        paddingRight: 8,
        paddingLeft: 8,
        margin: 16,
        alignSelf: 'stretch',
        borderRadius: 8,
        lineHeight: 20,
        backgroundColor: '#262525',
        color: '#b0b3b8'
    },
    loginButton: {
        backgroundColor: 'black',
        color: 'white',
        alignSelf: 'stretch',
        marginRight: 16,
        marginLeft: 16,
        height: 44,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 50,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: '#404040'
    },
    loginButtonText: {
        color: 'white',
        fontSize: 18,
        fontWeight: '500'
    },
    title: {
        fontSize: 36,
        fontWeight: 'bold',
        color: 'white'
    },
    subtitle: {
        fontSize: 13,
        marginBottom: 16,
        color: 'white'
    },
    logo: {
        marginTop: 30,
        height: 150,
        width: 200
    },
    loginOptionsContainer: {
        marginTop: 20,
        width: '100%',
        justifyContent: 'center',
        alignItems: 'center'
    },
    modeText: {
        color: '#b0b3b8',
        marginBottom: 5,
        fontSize: 12
    },
    backButton: {
        paddingLeft: 20,
        paddingRight: 20
    }
});