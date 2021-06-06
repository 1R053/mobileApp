import React from "react";
import { authentication } from "@services/authorization/authentication";
import { crypto } from "@services/authorization/crypto";
import { NavigationProp, RouteProp } from '@react-navigation/native';
import { Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { LoginUserListComponent } from "./components/loginUserList.component";
import { AuthenticatedUser, AuthenticatedUserEncryptionKey, AuthenticatedUserTypes } from '@types';
import { constants } from "@globals/constants";
import { globals } from "@globals/globals";
import * as SecureStore from 'expo-secure-store';
import { themeStyles } from "@styles/globalColors";
import { ScrollView } from "react-native-gesture-handler";
import * as ScreenCapture from 'expo-screen-capture';

type RouteParams = {
    Identity: {
        addAccount: boolean;
    }
}

interface Props {
    navigation: NavigationProp<any>;
    route: RouteProp<RouteParams, 'Identity'>;
}

interface State {
    advanced: boolean;
    accountLoaded: boolean;
    working: boolean;
    standardPublicKey: string;
    nonStandardPublicKey?: string;
}

export class IdentityScreen extends React.Component<Props, State> {

    mnemonic: string = '';
    extraText: string = '';

    private _user: AuthenticatedUserTypes | undefined = undefined;

    constructor(props: Props) {
        super(props);

        this.state = {
            advanced: false,
            accountLoaded: false,
            standardPublicKey: '',
            working: false
        };

        this.loadAccount = this.loadAccount.bind(this);
        this.back = this.back.bind(this);
        this.selectAccount = this.selectAccount.bind(this);

        ScreenCapture.preventScreenCaptureAsync();
    }

    componentWillUnmount(){
        ScreenCapture.allowScreenCaptureAsync();
    }

    loadAccount() {
        if (this.state.working) {
            return;
        }

        try {
            this.setState({ working: true });
            const isValidMnemonic = crypto.isValidMnemonic(this.mnemonic);

            if (!isValidMnemonic) {
                Alert.alert('Error', 'Seed phrase is invalid');
                return;
            }


            this._user = authentication.authenticateUser(this.mnemonic, this.extraText);

            const standardPublicKey = this._user.standard.authenticatedUser.publicKey;
            const nonStandardPublicKey = this._user.nonStandard?.authenticatedUser.publicKey;

            this.setState(
                {
                    standardPublicKey,
                    nonStandardPublicKey,
                    accountLoaded: true,
                    working: false
                }
            );

        } catch {
            Alert.alert('Error', 'Seed phrase is invalid');
        }
        this.mnemonic = '';
        this.extraText = '';
    }

    back() {
        this.setState(previousState => ({ accountLoaded: !previousState.accountLoaded }))
    }

    async selectAccount(publicKey: string) {
        const user = this._user as AuthenticatedUserTypes;

        const { authenticatedUser, key } = publicKey === this.state.standardPublicKey ?
            user.standard : user.nonStandard as { authenticatedUser: AuthenticatedUser, key: AuthenticatedUserEncryptionKey };

        authentication.addAuthenticatedUser(authenticatedUser, key);
        await SecureStore.setItemAsync(constants.localStorage_publicKey, publicKey);
        await SecureStore.setItemAsync(constants.localStorage_readonly, 'false');
        globals.user = { publicKey, username: '' };
        globals.readonly = false;
        globals.onLoginSuccess();
    }

    render() {
        return this.state.accountLoaded ?
            <LoginUserListComponent
                standardPublicKey={this.state.standardPublicKey}
                nonStandardPublicKey={this.state.nonStandardPublicKey}
                back={this.back}
                selectAccount={this.selectAccount}
            ></LoginUserListComponent>
            :
            <ScrollView style={[styles.container]} bounces={false}>
                <Text style={styles.text}>Enter your seed phrase to load your account</Text>
                <TextInput
                    style={[styles.textInput]}
                    onChangeText={value => this.mnemonic = value}
                    multiline={true}
                    placeholder={'Enter your seed phrase here.'}
                    placeholderTextColor={'#b0b3b8'}
                    keyboardAppearance={'dark'}
                    textAlignVertical={'top'}
                >
                </TextInput>

                {
                    this.state.advanced ?
                        <>
                            <Text style={styles.text}>If you have a passphrase, enter it below.</Text>
                            <TextInput
                                style={[styles.textInput]}
                                onChangeText={value => this.extraText = value}
                                multiline={true}
                                placeholder={'Enter your passphrase here.'}
                                placeholderTextColor={'#b0b3b8'}
                                keyboardAppearance={'dark'}
                                textAlignVertical={'top'}
                            >
                            </TextInput>
                        </>
                        : undefined
                }

                <TouchableOpacity
                    onPress={this.loadAccount}
                    style={[styles.loginButton, { backgroundColor: this.state.working ? themeStyles.disabledButton.backgroundColor : 'black' }]}
                    activeOpacity={0.8}
                >
                    <Text style={styles.loginButtonText}>Load Account</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.advancedButton} onPress={() => this.setState(previousState => ({ advanced: !previousState.advanced }))}>
                    <Text style={styles.advancedText}>{this.state.advanced ? 'Simple' : 'Advanced'}</Text>
                </TouchableOpacity>
            </ScrollView>
    }
}

const styles = StyleSheet.create(
    {
        container: {
            flex: 1,
            backgroundColor: '#171717',
            padding: 10
        },
        text: {
            color: '#ebebeb',
            marginBottom: 10
        },
        textInput: {
            color: '#ebebeb',
            height: 100,
            borderWidth: 1,
            borderColor: '#4a4a4a',
            padding: 10,
            paddingTop: 10,
            borderRadius: 5,
            marginBottom: 10
        },
        loginButton: {
            color: 'white',
            alignSelf: 'stretch',
            height: 44,
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: 5,
            marginBottom: 10,
            borderWidth: 1,
            borderColor: '#404040'
        },
        loginButtonText: {
            color: 'white',
            fontSize: 18,
            fontWeight: '500'
        },
        advancedText: {
            color: '#b0b3b8',
            marginBottom: 5,
            fontSize: 12
        },
        advancedButton: {
            marginLeft: 'auto',
            marginRight: 'auto'
        }
    }
);