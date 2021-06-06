import React, { useEffect, useState } from 'react';
import { Text, View, StyleSheet, Image, Keyboard, Dimensions, ActivityIndicator } from 'react-native';
import { ScrollView, TextInput, TouchableWithoutFeedback } from 'react-native-gesture-handler';
import { MaterialIcons } from '@expo/vector-icons';
import { CreatorCoinHODLer, Profile } from '@types';
import { globals, navigatorGlobals } from '@globals';
import { api, cache, promiseHelper, setLocalMessage } from '@services';
import { themeStyles } from '@styles';
import { signing } from '@services/authorization/signing';

export function MessageTopHoldersInputScreen({ route, navigation }: any) {
    const [isLoading, setLoading] = useState(true);
    const [isSending, setSending] = useState(false);
    const [profile, setProfile] = useState({} as Profile);
    const [messageText, setMessageText] = useState('');
    const [relevantHolders, setRelevantHolders] = useState<string[]>([]);
    const [receiversCount, setReceiversCount] = useState(0);
    const [alreadyReceivedCount, setAlreadyReceivedCount] = useState(0);

    let mount = true;

    navigatorGlobals.broadcastMessage = broadcastMessages;

    useEffect(
        () => {
            cache.user.getData(true).then(
                p_user => {
                    let user = p_user;
                    const profile = user.ProfileEntryResponse;
                    let usersWhoHODLYou: CreatorCoinHODLer[] = [];

                    usersWhoHODLYou = user.UsersWhoHODLYou?.filter(
                        p_user => p_user.CreatorPublicKeyBase58Check !== p_user.HODLerPublicKeyBase58Check && p_user.HasPurchased
                    );

                    if (usersWhoHODLYou?.length > 0) {
                        const relevantHoldersCount = route.params.count === -1 ? usersWhoHODLYou.length : route.params.count;

                        usersWhoHODLYou.sort(
                            (p_user1, p_user2) => p_user1.BalanceNanos > p_user2.BalanceNanos ? -1 : 1
                        );

                        usersWhoHODLYou = usersWhoHODLYou.slice(0, relevantHoldersCount).filter(p_user => !!p_user.ProfileEntryResponse);
                        if (mount) {
                            setProfile(profile);
                            setLoading(false);
                            setRelevantHolders(usersWhoHODLYou.map(p_user => p_user.HODLerPublicKeyBase58Check));
                        }
                    } else {
                        alert('You do not have any coin holders!');
                        navigation.goBack();
                    }
                }
            ).catch(p_error => globals.defaultHandleError(p_error));

            return () => {
                mount = false;
            }
        },
        []
    );

    async function broadcastMessages() {
        if (isSending) {
            return;
        }

        broadcastMessagesInBatches(relevantHolders);
    }

    async function broadcastMessagesInBatches(p_holders: string[]) {
        setSending(true);
        setReceiversCount(p_holders.length);

        if (mount) {
            setLoading(true);
        }

        try {
            for (const holder of p_holders) {
                await promiseHelper.retryOperation(
                    () => {
                        return new Promise(
                            (resolve: any, reject: any) => {
                                api.sendMessage(globals.user.publicKey, holder, messageText).then(
                                    async p_response => {
                                        const transactionHex = p_response.TransactionHex;
                                        const signedTransactionHex = await signing.signTransaction(transactionHex);
                                        await api.submitTransaction(signedTransactionHex as string);

                                        await setLocalMessage(globals.user.publicKey, holder, p_response.TstampNanos, messageText)
                                            .then(() => { })
                                            .catch(() => { });
                                        resolve();
                                    }
                                ).catch(() => reject());
                            }
                        );
                    },
                    5000,
                    10
                ).then(
                    () => {
                        setAlreadyReceivedCount(p_previous => p_previous + 1);
                    }
                ).catch(() => { });
            }

        } catch {
            alert('Something went wrong! Please try again.');
        } finally {
            goToMessages();
        }
    }

    function goToMessages() {
        navigation.navigate('Messages');
    }

    return isSending ?
        <View
            style={[styles.sendingContainer, styles.container, themeStyles.containerColorMain]}
        >
            <Text style={[themeStyles.fontColorMain]}>We are broadcasting your message to your coin holders. Please do not leave this page.</Text>
            <Text style={[styles.sendingProgressText, themeStyles.fontColorMain]}>{alreadyReceivedCount}/{receiversCount}</Text>
        </View>
        :
        <ScrollView
            style={[styles.container, themeStyles.containerColorMain]}
            bounces={false}
        >
            {
                isLoading ?
                    <ActivityIndicator style={styles.activityIndicator} color={themeStyles.fontColorMain.color}></ActivityIndicator>
                    :
                    <TouchableWithoutFeedback
                        style={{ paddingBottom: 500 }}
                        onPress={Keyboard.dismiss}
                    >
                        <View style={styles.headerContainer}>
                            <Image style={styles.profilePic} source={{ uri: profile.ProfilePic }}></Image>
                            <Text style={[styles.username, themeStyles.fontColorMain]}>{profile.Username}</Text>
                            {
                                profile.IsVerified ?
                                    <MaterialIcons name="verified" size={16} color="#007ef5" /> : undefined
                            }
                        </View>

                        <TextInput
                            style={[styles.textInput, themeStyles.fontColorMain]}
                            placeholder="Share value with your coin holders..."
                            placeholderTextColor={themeStyles.fontColorSub.color}
                            multiline
                            maxLength={2048}
                            value={messageText}
                            autoFocus
                            onChangeText={setMessageText}
                        ></TextInput>

                    </TouchableWithoutFeedback>
            }
        </ScrollView>
        ;
}

const styles = StyleSheet.create(
    {
        sendingContainer: {
            alignItems: 'center',
            paddingRight: 50,
            paddingLeft: 50,
            paddingTop: 200

        },
        sendingProgressText: {
            marginTop: 20,
            fontSize: 40,
            fontWeight: '500'

        },
        container: {
            flex: 1
        },
        activityIndicator: {
            marginTop: 175
        },
        headerContainer: {
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            paddingLeft: 10,
            paddingTop: 10
        },
        profilePic: {
            width: 30,
            height: 30,
            borderRadius: 8,
            marginRight: 10
        },
        username: {
            fontWeight: 'bold',
            marginRight: 6,
            maxWidth: Dimensions.get('window').width * 0.6
        },
        textInput: {
            marginRight: 10,
            marginLeft: 10,
            fontSize: 16,
            width: Dimensions.get('window').width - 20,
            minHeight: 50,
            marginTop: 10
        },
    }
);