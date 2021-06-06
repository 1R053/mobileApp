import React from "react";
import { ActivityIndicator, StyleSheet, TouchableOpacity, View, Image, Text, Dimensions } from "react-native";
import { User } from "@types";
import { api } from "@services/api";
import { MaterialIcons } from '@expo/vector-icons';
import { calculateAndFormatBitCloutInUsd, loadTickersAndExchangeRate } from "@services/bitCloutCalculator";
import { getAnonymousProfile } from "@services/helpers";

interface Props {
    standardPublicKey: string;
    nonStandardPublicKey?: string;
    back: () => void;
    selectAccount: (publicKey: string) => void;
}

interface State {
    loading: boolean;
    users: User[]
}

export class LoginUserListComponent extends React.Component<Props, State> {

    private _isMounted = false;

    constructor(props: Props) {
        super(props);

        this.state = {
            loading: true,
            users: []
        };

        this.loadUsers();
    }

    componentDidMount() {
        this._isMounted = true;
    }

    componentWillUnmount() {
        this._isMounted = false;
    }

    async loadUsers() {
        const publicKeys = [this.props.standardPublicKey];

        if (this.props.nonStandardPublicKey) {
            publicKeys.push(this.props.nonStandardPublicKey);
        }

        try {
            await loadTickersAndExchangeRate();
            const response = await api.getProfile(publicKeys);

            const users = response.UserList as User[];

            if (users?.length > 1) {
                const nonStandardUser = users[1];

                const shouldAddNonStandardUser = nonStandardUser?.ProfileEntryResponse ||
                    nonStandardUser?.BalanceNanos > 0 ||
                    nonStandardUser?.UsersYouHODL?.length > 0;

                if (!shouldAddNonStandardUser) {
                    users.splice(1, 1);
                }
            }

            for (const user of users) {
                if (!user.ProfileEntryResponse) {
                    user.ProfileEntryResponse = getAnonymousProfile(user.PublicKeyBase58Check);
                }
            }

            if (this._isMounted) {
                this.setState(
                    {
                        loading: false,
                        users
                    }
                );
            }
        } catch {

        }
    }

    render() {
        return <View style={styles.container}>
            {
                this.state.loading ?
                    <ActivityIndicator style={styles.activityIndicator} color={'#ebebeb'}></ActivityIndicator>
                    :
                    <View>
                        <Text style={styles.chooseAccountText}>Choose an Account</Text>
                        {
                            this.state.users.map(
                                (user, index) => <TouchableOpacity
                                    onPress={() => this.props.selectAccount(user.PublicKeyBase58Check)}
                                    activeOpacity={0.6} key={user.PublicKeyBase58Check + index}>
                                    <View style={[styles.profileListCard]}>
                                        <Image style={styles.profileImage}
                                            source={{ uri: user.ProfileEntryResponse?.ProfilePic }}></Image>

                                        <View>
                                            <View style={styles.usernameContainer}>
                                                <Text style={[styles.username]}>{user.ProfileEntryResponse?.Username}</Text>
                                                {
                                                    user.ProfileEntryResponse?.IsVerified ?
                                                        <MaterialIcons name="verified" size={16} color="#007ef5" /> : undefined
                                                }
                                            </View>

                                            <View style={[styles.profileCoinPriceContainer]}>
                                                <Text
                                                    style={[styles.profileCoinPriceText]}
                                                >~${calculateAndFormatBitCloutInUsd(user.ProfileEntryResponse?.CoinPriceBitCloutNanos)}
                                                </Text>
                                            </View>
                                        </View>
                                    </View>
                                </TouchableOpacity>
                            )
                        }
                        <TouchableOpacity style={styles.backButton} onPress={this.props.back}>
                            <Text style={styles.backText}>Cancel</Text>
                        </TouchableOpacity>
                    </View>
            }
        </View>;
    }
}

const styles = StyleSheet.create(
    {
        container: {
            flex: 1,
            backgroundColor: '#171717'
        },
        activityIndicator: {
            marginTop: 175
        },
        chooseAccountText: {
            color: '#ebebeb',
            marginBottom: 10,
            marginLeft: 'auto',
            marginRight: 'auto',
            marginTop: '25%'
        },
        profileListCard: {
            display: 'flex',
            flexDirection: 'row',
            paddingTop: 16,
            paddingBottom: 16,
            paddingLeft: 10,
            paddingRight: 10,
            borderBottomWidth: 1,
            width: Dimensions.get('window').width,
            alignItems: 'center',
            backgroundColor: 'black',
            borderColor: '#262626'
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
            marginRight: 6,
            color: '#ebebeb'
        },
        profileCoinPriceContainer: {
            borderRadius: 12,
            paddingRight: 10,
            paddingLeft: 10,
            justifyContent: 'center',
            height: 20,
            alignSelf: 'flex-start',
            marginTop: 6,
            backgroundColor: '#262525'
        },
        profileCoinPriceText: {
            fontSize: 10,
            fontWeight: '600',
            color: '#ebebeb'
        },
        backText: {
            color: '#b0b3b8',
            marginBottom: 5,
            fontSize: 12
        },
        backButton: {
            marginLeft: 'auto',
            marginRight: 'auto',
            marginTop: 8
        }
    }
)