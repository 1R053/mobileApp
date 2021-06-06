import { api } from "@services/api";
import { authentication } from "@services/authorization/authentication";
import { getAnonymousProfile } from "@services/helpers";
import { themeStyles } from "@styles/globalColors";
import React from "react";
import { StyleSheet, TouchableOpacity, View, Image, Text, Dimensions, ActivityIndicator } from "react-native";
import Modal from 'react-native-modal';
import { Profile } from "@types";
import { globals } from "@globals/globals";
import { MaterialIcons } from '@expo/vector-icons';
import { calculateAndFormatBitCloutInUsd } from "@services/bitCloutCalculator";
import { AntDesign } from '@expo/vector-icons';
import { NavigationProp } from '@react-navigation/native';
import * as SecureStore from 'expo-secure-store';
import { constants } from "@globals/constants";
import { eventManager } from "@globals/injector";
import { EventType } from "@types";
import { FlatList } from "react-native-gesture-handler";
import { settingsGlobals } from "@globals/settingsGlobals";

interface Props {
    navigation: NavigationProp<any>;
}

interface State {
    loading: boolean;
    visible: boolean;
    profiles: Profile[];
}

export class ProfileManagerComponent extends React.Component<Props, State> {

    private _isMounted = false;

    constructor(props: Props) {
        super(props);

        this.state = {
            loading: true,
            visible: true,
            profiles: []
        };

        this.loadData();

        this.selectAccount = this.selectAccount.bind(this);
        this.addCount = this.addCount.bind(this);
        this.close = this.close.bind(this);
    }

    componentDidMount() {
        this._isMounted = true;
    }

    componentWillUnmount() {
        this._isMounted = false;
    }

    async loadData() {
        try {
            const publicKeys = await authentication.getAuthenticatedUserPublicKeys();

            const requests = publicKeys?.map(publicKey => api.getSingleProfile('', publicKey).catch(() => ({ Profile: getAnonymousProfile(publicKey) })));
            const response = await Promise.all(requests);

            const profiles = response.map(response => response.Profile);

            for (let i = 0; i < profiles.length; i++) {
                if (!profiles[i]) {
                    profiles[i] = getAnonymousProfile(publicKeys[i]);
                }
            }

            if (this._isMounted) {
                this.setState({ loading: false, profiles });
            }
        } catch (exception) {
            globals.defaultHandleError(exception);
            if (this._isMounted) {
                this.close();
            }
        }

    }

    async selectAccount(publicKey: string) {
        this.close(false);
        await SecureStore.setItemAsync(constants.localStorage_publicKey, publicKey);
        await SecureStore.setItemAsync(constants.localStorage_readonly, 'false');
        globals.user = { publicKey, username: '' };
        globals.readonly = false;
        globals.onLoginSuccess();
    }

    addCount() {
        this.close(false);
        this.props.navigation.navigate('Identity', { addAccount: true });
    }

    close(p_animated = true) {
        if (this._isMounted && p_animated) {
            this.setState({ visible: false });
        }

        const timeout = p_animated ? 1000 : 0;
        setTimeout(() => eventManager.dispatchEvent(EventType.ToggleProfileManager, { visible: false }), timeout)
    }

    render() {
        return <Modal
            style={styles.modal}
            animationIn={'slideInUp'}
            isVisible={this.state.visible}
            swipeDirection='down'
            animationOutTiming={200}
            onSwipeComplete={() => { this.close() }}
            onBackdropPress={() => { this.close() }}
            onBackButtonPress={() => { this.close() }}
            propagateSwipe={this.state.profiles?.length > 5}
        >
            <View style={[styles.container, themeStyles.modalBackgroundColor]}>
                {
                    this.state.loading ?
                        <ActivityIndicator color={themeStyles.fontColorMain.color}></ActivityIndicator>
                        :
                        <>
                            <FlatList
                                bounces={false}
                                data={this.state.profiles}
                                keyExtractor={(item, index) => item.PublicKeyBase58Check + index}
                                renderItem={({ item, index }) => (
                                    <TouchableOpacity
                                        onPress={() => this.selectAccount(item.PublicKeyBase58Check)}
                                        activeOpacity={0.7} key={item.PublicKeyBase58Check + index}>
                                        <View style={[styles.profileListCard, themeStyles.borderColor]}>
                                            <Image style={styles.profileImage}
                                                source={{ uri: item.ProfilePic }}></Image>

                                            <View>
                                                <View style={styles.usernameContainer}>
                                                    <Text style={[styles.username, themeStyles.fontColorMain]}>{item.Username}</Text>
                                                    {
                                                        item.IsVerified ?
                                                            <MaterialIcons name="verified" size={16} color="#007ef5" /> : undefined
                                                    }
                                                </View>

                                                <View style={[styles.profileCoinPriceContainer, { backgroundColor: settingsGlobals.darkMode ? '#171717' : '#ebebeb' }]}>
                                                    <Text
                                                        style={[styles.profileCoinPriceText, themeStyles.fontColorMain]}
                                                    >~${calculateAndFormatBitCloutInUsd(item.CoinPriceBitCloutNanos)}
                                                    </Text>
                                                </View>
                                            </View>

                                            {
                                                item.PublicKeyBase58Check === globals.user.publicKey ?
                                                    <AntDesign style={{ marginLeft: 'auto' }} name="checkcircle" size={24} color="#007ef5" />
                                                    : undefined
                                            }
                                        </View>
                                    </TouchableOpacity>
                                )}
                                ListFooterComponent={<TouchableOpacity
                                    style={styles.addAccountButton}
                                    activeOpacity={0.7}
                                    onPress={this.addCount}
                                >
                                    <AntDesign style={styles.addAccountButtonIcon} name="plus" size={22} color={themeStyles.fontColorMain.color} />
                                    <Text style={[styles.addAccountButtonText, themeStyles.fontColorMain]}>Add Account</Text>
                                </TouchableOpacity>}
                            >
                            </FlatList>
                        </>
                }
            </View>
        </Modal>
    }
}

const styles = StyleSheet.create(
    {
        modal: {
            width: '100%',
            marginLeft: 0,
            marginBottom: 0
        },
        container: {
            minHeight: '40%',
            maxHeight: '75%',
            marginTop: 'auto',
            borderTopRightRadius: 20,
            borderTopLeftRadius: 20,
            paddingTop: 16,
            paddingBottom: 50
        },
        profileListCard: {
            display: 'flex',
            flexDirection: 'row',
            paddingTop: 16,
            paddingBottom: 16,
            paddingLeft: 12,
            paddingRight: 12,
            borderBottomWidth: 1,
            width: Dimensions.get('window').width,
            alignItems: 'center'
        },
        profileImage: {
            width: 40,
            height: 40,
            borderRadius: 6,
            marginRight: 12
        },
        usernameContainer: {
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center'
        },
        username: {
            fontWeight: '700',
            maxWidth: Dimensions.get('window').width / 2,
            marginRight: 6
        },
        profileCoinPriceContainer: {
            borderRadius: 12,
            paddingRight: 10,
            paddingLeft: 10,
            justifyContent: 'center',
            height: 20,
            alignSelf: 'flex-start',
            marginTop: 6
        },
        profileCoinPriceText: {
            fontSize: 10,
            fontWeight: '600'
        },
        addAccountButton: {
            paddingTop: 20,
            paddingBottom: 20,
            paddingLeft: 10,
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center'
        },
        addAccountButtonIcon: {
            marginLeft: 11,
            marginRight: 18
        },
        addAccountButtonText: {
            fontWeight: '500'
        }
    }
);