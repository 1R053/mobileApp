import React, { useEffect, useState } from 'react';
import { ActionSheetIOS, Alert, Platform, StyleSheet, Text, View } from 'react-native';
import { TouchableOpacity } from 'react-native-gesture-handler';
import { useNavigation } from '@react-navigation/core';
import { Feather } from '@expo/vector-icons';
import { actionSheet, api, cache, snackbar } from '@services';
import { ChangeFollowersEvent, EventType, User } from '@types';
import { eventManager, globals, settingsGlobals } from '@globals';
import { themeStyles } from '@styles';
import Clipboard from 'expo-clipboard';
import { signing } from '@services/authorization/signing';
import NotificationSubscriptionComponent from '@screens/profile/notificationSubscription.component';

export function ProfileScreenOptionsComponent(
    { publicKey, goToChat }: { publicKey: string, goToChat: () => void }
) {
    const navigation = useNavigation();

    const [isFollowed, setIsFollowed] = useState<boolean | undefined>(undefined);
    const [followButtonColor, setFollowButtonColor] = useState<string>('black');

    let mount = true;

    useEffect(
        () => {
            cache.user.getData().then(
                p_response => checkIsFollowed(p_response)
            ).catch();

            return () => {
                mount = false;
            };
        },
        []
    );

    function checkIsFollowed(p_user: User) {
        const followedByUserPublicKeys = p_user.PublicKeysBase58CheckFollowedByUser as string[];

        const followed = followedByUserPublicKeys?.indexOf(publicKey);
        if (mount) {
            setIsFollowed(followed !== -1);
        }
    }

    function onFollowButtonClick() {
        if (isFollowed === undefined) {
            return;
        }

        setFollowButtonColor(themeStyles.buttonDisabledColor.backgroundColor);

        api.createFollow(globals.user.publicKey, publicKey, isFollowed).then(
            async p_response => {
                const transactionHex = p_response.TransactionHex;

                const signedTransactionHex = await signing.signTransaction(transactionHex);
                await api.submitTransaction(signedTransactionHex as string);

                if (mount) {
                    const event: ChangeFollowersEvent = {
                        publicKey: publicKey
                    };

                    if (isFollowed) {
                        eventManager.dispatchEvent(EventType.DecreaseFollowers, event);
                    } else {
                        eventManager.dispatchEvent(EventType.IncreaseFollowers, event);
                    }

                    setIsFollowed((p_previousValue: boolean | undefined) => !p_previousValue);
                }

                if (isFollowed) {
                    cache.removeFollower(publicKey);
                } else {
                    cache.addFollower(publicKey);
                }
            }
        ).catch(
            p_error => globals.defaultHandleError(p_error)
        ).finally(() => setFollowButtonColor('black'));
    }

    async function onProfileOptionsClick() {
        const user = await cache.user.getData();
        const isUserBlocked = user?.BlockedPubKeys && !!user.BlockedPubKeys[publicKey];
        const blockOptionText = isUserBlocked ? 'Unblock User' : 'Block User';

        const options = ['Copy Public Key', blockOptionText, 'Cancel'];

        const callback = async (p_optionIndex: number) => {
            if (p_optionIndex === 0) {
                Clipboard.setString(publicKey);
                snackbar.showSnackBar(
                    {
                        text: 'Public key copied to clipboard.'
                    }
                );
            } else if (p_optionIndex === 1) {
                const jwt = await signing.signJWT();

                api.blockUser(globals.user.publicKey, publicKey, jwt as string, isUserBlocked).then(
                    async () => {
                        try {
                            const blockedText = isUserBlocked ? 'unblocked' : 'blocked';
                            await cache.user.getData(true);
                            snackbar.showSnackBar(
                                {
                                    text: 'User has been ' + blockedText
                                }
                            );
                            if (!isUserBlocked) {
                                navigation.navigate(
                                    'Home',
                                    {
                                        blockedUser: publicKey
                                    }
                                );
                            }
                        } catch {
                            Alert.alert('Error', 'Something went wrong! Please try again.');
                        }
                    }
                ).catch(p_error => globals.defaultHandleError(p_error));
            }
        }
        if (Platform.OS === 'ios') {
            ActionSheetIOS.showActionSheetWithOptions(
                {
                    options: options,
                    destructiveButtonIndex: 1,
                    cancelButtonIndex: 2,
                },
                callback
            );
        } else {
            actionSheet.showActionSheet(
                {
                    options: options,
                    callback: callback
                }
            );
        }
    }

    return <View style={styles.container}>
        <NotificationSubscriptionComponent publicKey={publicKey} />
        <TouchableOpacity
            disabled={followButtonColor !== 'black'}
            style={[
                styles.followButton,
                themeStyles.buttonBorderColor,
                { backgroundColor: followButtonColor, borderWidth: settingsGlobals.darkMode ? 1 : 0 }
            ]}
            activeOpacity={1}
            onPress={onFollowButtonClick}
        >
            <Text
                style={styles.followButtonText}
            >{isFollowed ? 'Unfollow' : 'Follow'}</Text>
        </TouchableOpacity>
        <TouchableOpacity
            style={[
                styles.followButton,
                themeStyles.buttonBorderColor,
                { borderWidth: settingsGlobals.darkMode ? 1 : 0 }
            ]}
            activeOpacity={1}
            onPress={goToChat}
        >
            <Text style={styles.followButtonText}>Message</Text>
        </TouchableOpacity>
        <TouchableOpacity
            activeOpacity={1}
            onPress={onProfileOptionsClick}
        >
            <Feather name="more-horizontal" size={24} color={themeStyles.fontColorMain.color} />
        </TouchableOpacity>
    </View>
}

const styles = StyleSheet.create(
    {
        container: {
            display: 'flex',
            flexDirection: 'row',
            justifyContent: 'flex-end'
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
            backgroundColor: 'black'
        },
        followButtonText: {
            color: 'white'
        }
    }
);
