import { useNavigation } from '@react-navigation/native';
import React, { useEffect, useState } from 'react';
import { Dimensions, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { calculateAndFormatBitCloutInUsd, formatNumber, getAnonymousProfile } from '@services';
import { CreatorCoinHODLer } from '@types';
import { themeStyles } from '@styles';

export function CreatorCoinHODLerComponent({
    creatorCoinPrice, userWhoHODL: userWhoHODL }: { creatorCoinPrice: undefined | number, userWhoHODL: CreatorCoinHODLer }
) {
    const navigation = useNavigation();

    let mount = true;
    const [hodlerCoinPriceUSD, setHODLerCoinPrice] = useState('');
    const [hodlerAmountCoins, setHODLerAmountCoins] = useState('');
    const [hodlerAmountUSD, setHODLerAmountUSD] = useState('');

    useEffect(
        () => {

            try {
                if (!userWhoHODL.ProfileEntryResponse) {
                    userWhoHODL.ProfileEntryResponse = getAnonymousProfile(userWhoHODL.HODLerPublicKeyBase58Check);
                }

                const hodlerCoinPriceUSD = calculateAndFormatBitCloutInUsd(
                    userWhoHODL.ProfileEntryResponse.CoinPriceBitCloutNanos);
                const hodlerAmountCoins = userWhoHODL.BalanceNanos / 1000000000;

                if (creatorCoinPrice == null) {
                    creatorCoinPrice = 0;
                }

                const hodlerAmountUSD = hodlerAmountCoins * creatorCoinPrice;
                const formattedHODLerAmountInUSD = formatNumber(hodlerAmountUSD);

                if (mount) {
                    setHODLerCoinPrice(hodlerCoinPriceUSD);
                    setHODLerAmountCoins(hodlerAmountCoins.toFixed(4));
                    setHODLerAmountUSD(formattedHODLerAmountInUSD);
                }

            } catch { }

            return () => {
                mount = false;
            }
        },
        []
    );

    function goToProfile() {
        if (userWhoHODL.ProfileEntryResponse &&
            userWhoHODL.ProfileEntryResponse.Username !== 'anonymous') {
            (navigation as any).push(
                'AppNavigator',
                {
                    screen: 'UserProfile',
                    params: {
                        publicKey: userWhoHODL.ProfileEntryResponse.PublicKeyBase58Check,
                        username: userWhoHODL.ProfileEntryResponse.Username
                    },
                    key: 'Profile_' + userWhoHODL.ProfileEntryResponse.PublicKeyBase58Check
                }
            );
        }
    }

    return <TouchableOpacity onPress={goToProfile} activeOpacity={1}>
        <View style={[styles.userWhoHODLCard, themeStyles.containerColorMain, themeStyles.borderColor]}>
            <Image style={styles.profileImage}
                source={{ uri: userWhoHODL.ProfileEntryResponse?.ProfilePic }}></Image>

            <View>
                <Text style={[styles.username, themeStyles.fontColorMain]}>{userWhoHODL.ProfileEntryResponse?.Username}</Text>
                <View style={[styles.hodlerCoinPriceContainer, themeStyles.chipColor]}>
                    <Text style={[styles.HODLerCoinPriceText, themeStyles.fontColorMain]}>~${hodlerCoinPriceUSD}</Text>
                </View>
            </View>

            <View style={styles.HODLerAmountContainer}>
                <Text style={[styles.hodlerAmountCoins, themeStyles.fontColorMain]}>{hodlerAmountCoins}</Text>
                <Text style={[styles.hodlerAmountUSD, themeStyles.fontColorMain]}>~${hodlerAmountUSD}</Text>
            </View>
        </View>
    </TouchableOpacity>
}

const styles = StyleSheet.create(
    {
        activityIndicator: {
            marginTop: 175
        },
        userWhoHODLCard: {
            display: 'flex',
            flexDirection: 'row',
            paddingTop: 16,
            paddingBottom: 16,
            paddingLeft: 10,
            paddingRight: 10,
            borderBottomWidth: 1,
            width: Dimensions.get('window').width

        },
        profileImage: {
            width: 40,
            height: 40,
            borderRadius: 6,
            marginRight: 12
        },
        username: {
            fontWeight: '700',
            maxWidth: Dimensions.get('window').width / 2
        },
        hodlerCoinPriceContainer: {
            borderRadius: 12,
            paddingRight: 10,
            paddingLeft: 10,
            justifyContent: 'center',
            height: 20,
            alignSelf: 'flex-start',
            marginTop: 6
        },
        HODLerCoinPriceText: {
            fontSize: 10,
            fontWeight: '600'
        },
        HODLerAmountContainer: {
            marginLeft: 'auto',
            justifyContent: 'center'
        },
        hodlerAmountCoins: {
            fontWeight: '600',
            fontSize: 16
        },
        hodlerAmountUSD: {
            marginTop: 4,
            fontSize: 11
        }
    }
);
