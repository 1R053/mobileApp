import React from "react";
import { View, StyleSheet, Image, Text, Dimensions, TouchableOpacity } from 'react-native';
import { CreatorCoinTransaction, Profile } from "@types";
import { MaterialIcons } from '@expo/vector-icons';
import { themeStyles } from "@styles/globalColors";
import { calculateDurationUntilNow, formatNumber, getAnonymousProfile } from "@services/helpers";
import { Ionicons } from '@expo/vector-icons';
import { FontAwesome5 } from '@expo/vector-icons';
import { NavigationProp } from "@react-navigation/native";
import { calculateAndFormatBitCloutInUsd } from "@services/bitCloutCalculator";

interface Props {
    navigation: NavigationProp<any>;
    creatorCoinTransaction: CreatorCoinTransaction;
    publicKey: string;
    profile: Profile | null;
}

interface State {
}

export class CreatorCoinTransactionComponent extends React.Component<Props, State> {

    constructor(props: Props) {
        super(props);
    }

    shouldComponentUpdate(p_nextProps: Props) {
        return p_nextProps.publicKey !== this.props.publicKey ||
            (p_nextProps.profile != null) !== (this.props.profile != null);
    }

    goToProfile(p_profile: Profile) {
        if (p_profile.Username !== 'anonymous') {
            (this.props.navigation as any).push(
                'AppNavigator',
                {
                    screen: 'UserProfile',
                    params: {
                        publicKey: p_profile.PublicKeyBase58Check,
                        username: p_profile.Username
                    },
                    key: 'Profile_' + p_profile.PublicKeyBase58Check
                }
            );
        }
    }

    render() {
        const profile = this.props.profile ?? getAnonymousProfile(this.props.publicKey);
        const formattedCoinPrice = calculateAndFormatBitCloutInUsd(profile.CoinPriceBitCloutNanos);

        return <TouchableOpacity onPress={() => this.goToProfile(profile)} activeOpacity={1}>
            <View style={[styles.profileListCard, themeStyles.containerColorMain, themeStyles.borderColor]}>
                <Image style={styles.profileImage}
                    source={{ uri: profile.ProfilePic }}></Image>

                <View>
                    <View style={styles.usernameContainer}>
                        <Text style={[styles.username, themeStyles.fontColorMain]}>{profile.Username}</Text>
                        {
                            profile.IsVerified ?
                                <MaterialIcons name="verified" size={16} color="#007ef5" /> : undefined
                        }
                    </View>

                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <View style={[styles.profileCoinPriceContainer, themeStyles.chipColor]}>
                            <Text style={[styles.profileCoinPriceText, themeStyles.fontColorMain]}>~${formattedCoinPrice}</Text>
                        </View>

                        <Ionicons style={styles.durationIcon} name="ios-time-outline" size={14} color={themeStyles.fontColorSub.color} />
                        <Text style={[styles.durationText, themeStyles.fontColorSub]}>{calculateDurationUntilNow(this.props.creatorCoinTransaction.timeStamp * 1000000000)}</Text>

                    </View>
                </View>

                {
                    this.props.creatorCoinTransaction.bitcloutValue > 0 ?
                        <FontAwesome5 style={{ marginLeft: 'auto', marginRight: 10 }} name="arrow-circle-up" size={24} color="#30c296" />
                        :
                        <FontAwesome5 style={{ marginLeft: 'auto', marginRight: 10 }} name="arrow-circle-down" size={24} color="#e24c4f" />
                }

                <View style={styles.transactionAmountContainer}>
                    <Text style={[styles.transactionAmountCoins, themeStyles.fontColorMain]}>{Math.abs(this.props.creatorCoinTransaction.coinsChange).toFixed(4)}</Text>
                    <Text style={[styles.transactionAmountUSD, themeStyles.fontColorMain]}>~${formatNumber(Math.abs(this.props.creatorCoinTransaction.usdValue))}</Text>
                </View>
            </View>
        </TouchableOpacity>
    }
}

const styles = StyleSheet.create(
    {
        profileListCard: {
            display: 'flex',
            flexDirection: 'row',
            paddingTop: 16,
            paddingBottom: 16,
            paddingLeft: 10,
            paddingRight: 10,
            borderBottomWidth: 1,
            width: Dimensions.get('window').width,
            alignItems: 'center'
        },
        profileImage: {
            width: 35,
            height: 35,
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
        transactionAmountContainer: {
            justifyContent: 'center',
            minWidth: 55
        },
        transactionAmountCoins: {
            fontWeight: '600',
            fontSize: 16
        },
        transactionAmountUSD: {
            fontSize: 10
        },
        durationIcon: {
            marginLeft: 8,
            marginRight: 2,
            marginTop: 6
        },
        durationText: {
            fontSize: 12,
            marginTop: 6
        }
    }
);