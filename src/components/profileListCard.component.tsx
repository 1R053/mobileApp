import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Image, Text, Dimensions, TouchableOpacity } from 'react-native';
import { Profile } from '../types';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { themeStyles } from '@styles';
import { globals, settingsGlobals } from '@globals';
import { api, cache, calculateAndFormatBitCloutInUsd } from '@services';
import { signing } from '@services/authorization/signing';

export function ProfileListCardComponent({ profile, isFollowing }:
    { profile: Profile, isFollowing: boolean }) {

    const navigation = useNavigation();

    const [profileCoinPrice, setProfileCoinPrice] = useState('');
    const [working, setWorking] = useState(false);
    const [following, setFollowing] = useState(false);
    const [showFollowButton, setShowFollowButton] = useState(false);

    let mount = true;

    useEffect(
        () => {
            const coinPrice = calculateAndFormatBitCloutInUsd(profile.CoinPriceBitCloutNanos);

            if (mount) {
                setShowFollowButton(profile.PublicKeyBase58Check !== globals.user.publicKey);
                setFollowing(isFollowing);
                setProfileCoinPrice(coinPrice);
            }

            return () => {
                mount = false;
            }
        },
        []
    );

    function onFollowButtonClick() {
        setWorking(true);
        api.createFollow(globals.user.publicKey, profile.PublicKeyBase58Check, following).then(
            async p_response => {
                const transactionHex = p_response.TransactionHex;

                const signedTransactionHex = await signing.signTransaction(transactionHex);
                await api.submitTransaction(signedTransactionHex as string);

                if (mount) {
                    setFollowing((p_previous) => !p_previous);
                }

                if (following) {
                    cache.removeFollower(profile.PublicKeyBase58Check);
                } else {
                    cache.addFollower(profile.PublicKeyBase58Check);
                }
            }
        ).catch(
            p_error => globals.defaultHandleError(p_error)
        ).finally(
            () => {
                if (mount) {
                    setWorking(false)
                }
            }
        );
    }

    function goToProfile() {
        if (profile.Username !== 'anonymous') {
            (navigation as any).push(
                'AppNavigator',
                {
                    screen: 'UserProfile',
                    params: {
                        publicKey: profile.PublicKeyBase58Check,
                        username: profile.Username
                    },
                    key: 'Profile_' + profile.PublicKeyBase58Check
                }
            );
        }
    }

    return <TouchableOpacity onPress={goToProfile} activeOpacity={1}>
        <View style={[styles.profileListCard, themeStyles.containerColorMain, themeStyles.borderColor]}>
            <Image style={styles.profileImage}
                source={{ uri: profile?.ProfilePic }}></Image>

            <View>
                <View style={styles.usernameContainer}>
                    <Text style={[styles.username, themeStyles.fontColorMain]}>{profile?.Username}</Text>
                    {
                        profile?.IsVerified ?
                            <MaterialIcons name="verified" size={16} color="#007ef5" /> : undefined
                    }
                </View>

                <View style={[styles.profileCoinPriceContainer, themeStyles.chipColor]}>
                    <Text style={[styles.profileCoinPriceText, themeStyles.fontColorMain]}>~${profileCoinPrice}</Text>
                </View>
            </View>

            {
                showFollowButton && !globals.readonly ?
                    <View style={styles.followButtonContainer}>
                        <TouchableOpacity
                            style={[
                                styles.followButton,
                                themeStyles.buttonBorderColor,
                                {
                                    backgroundColor: working ? themeStyles.buttonDisabledColor.backgroundColor : 'black',
                                    borderWidth: settingsGlobals.darkMode ? 1 : 0
                                }
                            ]}
                            onPress={onFollowButtonClick}>
                            <Text style={styles.followButtonText}>{following ? 'Unfollow' : 'Follow'}</Text>
                        </TouchableOpacity>
                    </View> : undefined
            }
        </View>
    </TouchableOpacity>
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
            width: 30,
            height: 30,
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
        followButtonContainer: {
            marginLeft: 'auto',
            marginTop: 6
        },
        followButton: {
            display: 'flex',
            flexDirection: 'row',
            justifyContent: 'center',
            alignItems: 'center',
            marginRight: 10,
            paddingRight: 12,
            paddingLeft: 12,
            paddingTop: 6,
            paddingBottom: 6,
            borderRadius: 4,
            marginBottom: 8,
            width: 85
        },
        followButtonText: {
            color: 'white'
        }
    }
);
