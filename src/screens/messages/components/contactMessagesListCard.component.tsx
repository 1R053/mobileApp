import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Image, Text, Dimensions } from 'react-native';
import { ContactWithMessages } from '../../../types';
import { MaterialIcons } from '@expo/vector-icons';
import { TouchableOpacity } from 'react-native-gesture-handler';
import { useNavigation } from '@react-navigation/native';
import { AntDesign } from '@expo/vector-icons';
import { globals } from '@globals';
import { api, calculateDurationUntilNow, getMessageText } from '@services';
import { themeStyles } from '@styles';
import { signing } from '@services/authorization/signing';

export function ContactMessagesListCardComponent(
    { contactWithMessages }: { contactWithMessages: ContactWithMessages }
) {
    const [lastMessageText, setLastMessageText] = useState<string>('');
    const [duration, setDuration] = useState<string>('');
    const [showCreatorCoinHolding, setShowCreatorCoinHolding] = useState<boolean>(false);
    const [unreadMessages, setUnreadMessages] = useState<boolean>(false);
    const navigation = useNavigation();

    useEffect(
        () => {
            let mount = true;

            setShowCreatorCoinHolding(
                (contactWithMessages.CreatorCoinHoldingAmount as number) > 0 && globals.investorFeatures
            );
            setUnreadMessages(contactWithMessages.UnreadMessages as boolean);

            let lastMessage = contactWithMessages.Messages?.length > 0 ?
                contactWithMessages.Messages[contactWithMessages.Messages.length - 1] : undefined;

            if (lastMessage) {
                getMessageText(lastMessage).then(
                    p_text => {
                        if (mount) {
                            setLastMessageText(p_text)
                        }
                    }
                ).catch(() => { });

                setDuration(calculateDurationUntilNow(lastMessage.TstampNanos));
            } else {
                setLastMessageText('');
            }

            return () => {
                mount = false;
            }
        },
        []
    );

    async function goToChat() {
        if (contactWithMessages.UnreadMessages) {

            try {
                const jwt = await signing.signJWT();
                api.markContactMessagesRead(
                    globals.user.publicKey, contactWithMessages.PublicKeyBase58Check, jwt as string
                )
                contactWithMessages.UnreadMessages = false;
                setUnreadMessages(false);
            } catch {

            }
        }

        navigation.navigate(
            'Chat',
            {
                contactWithMessages: contactWithMessages
            }
        );
    }

    return <TouchableOpacity style={[styles.touchableContainer, themeStyles.containerColorMain, themeStyles.borderColor]} activeOpacity={0.8} onPress={goToChat}>
        <View style={styles.container}>
            <Image style={styles.profilePic}
                source={{ uri: contactWithMessages.ProfileEntryResponse?.ProfilePic }}></Image>
            <View style={styles.verticalContainer}>
                <View style={styles.horizontalContainer}>
                    <Text style={[styles.username, themeStyles.fontColorMain]}>{contactWithMessages.ProfileEntryResponse?.Username}</Text>
                    {
                        contactWithMessages.ProfileEntryResponse?.IsVerified ?
                            <MaterialIcons style={{ marginBottom: 2, marginRight: 6 }} name="verified" size={16} color="#007ef5" /> : undefined
                    }
                    {
                        showCreatorCoinHolding ?
                            < AntDesign style={{ marginBottom: 3 }} name={'star'} size={15} color={'#ffdb58'} /> : undefined
                    }
                </View>

                <View style={styles.horizontalContainer}>
                    <Text style={[styles.lastMessage, themeStyles.fontColorSub]} numberOfLines={1}>{lastMessageText}</Text>
                    <Text style={[styles.lastMessage, themeStyles.fontColorSub]}> • {duration}</Text>
                </View>
            </View>
            {
                unreadMessages ?
                    < View style={[styles.unreadMessagesCountContainer]}>
                    </View>
                    :
                    undefined
            }
        </View>
    </TouchableOpacity >
}

const styles = StyleSheet.create(
    {
        touchableContainer: {
            width: "100%",
            height: 65,
            borderBottomWidth: 1
        },
        container: {
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            height: 65,
            paddingLeft: 10,
            paddingRight: 10
        },
        profilePic: {
            width: 40,
            height: 40,
            borderRadius: 8,
            marginRight: 12
        },
        verticalContainer: {
            display: 'flex',
            flexDirection: 'column'
        },
        horizontalContainer: {
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center'
        },
        username: {
            fontWeight: '700',
            marginRight: 6,
            marginBottom: 2
        },
        lastMessage: {
            fontSize: 13,
            maxWidth: Dimensions.get('window').width * 0.5
        },
        unreadMessagesCountContainer: {
            minWidth: 10,
            height: 10,
            borderRadius: 20,
            marginLeft: 'auto',
            marginRight: 10,
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: '#007ef5'
        }
    }
);
