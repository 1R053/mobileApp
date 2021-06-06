import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, Text, SectionList, Dimensions, KeyboardAvoidingView, Platform, Keyboard, ActivityIndicator } from 'react-native';
import { TextInput, TouchableOpacity } from 'react-native-gesture-handler';
import { Ionicons } from '@expo/vector-icons';
import { ContactWithMessages, Message } from '@types';
import { MessageComponent } from '@components/messageComponent';
import { globals, settingsGlobals } from '@globals';
import { api, setLocalMessage } from '@services';
import { themeStyles } from '@styles';
import { signing } from '@services/authorization/signing';

export function ChatScreen({ route, navigation }: any) {

    const [isLoading, setLoading] = useState<boolean>(true);
    const [sections, setSections] = useState<any[]>([]);
    const [textInputHeight, setTextInputHeight] = useState<number>(35);
    const [messageText, setMessageText] = useState('');
    const [paddingTop, setPaddingTop] = useState(0);
    const [changed, setChanged] = useState(false);

    const sectionListRef = useRef(null);

    let mount = true;

    useEffect(
        () => {
            const loadMessages = route.params?.loadMessages;
            let contactWithMessages = route.params?.contactWithMessages as ContactWithMessages;
            if (loadMessages) {
                api.getMessages(
                    globals.user.publicKey,
                    false,
                    false,
                    false,
                    false,
                    1000,
                    'time',
                    ''
                ).then(
                    p_response => {
                        const messages: ContactWithMessages[] = p_response?.OrderedContactsWithMessages ? p_response.OrderedContactsWithMessages : [];
                        const newContactWithMessages = messages.find(
                            p_message => p_message?.PublicKeyBase58Check === contactWithMessages.PublicKeyBase58Check
                        );

                        if (newContactWithMessages) {
                            contactWithMessages = newContactWithMessages;
                        }

                        if (mount) {
                            initializeSections(contactWithMessages);
                            setLoading(false);
                        }
                    }
                ).catch(p_error => globals.defaultHandleError(p_error));
            } else {
                initializeSections(contactWithMessages);
                setLoading(false);
            }

            Keyboard.addListener("keyboardWillShow", keyboardWillShow);
            Keyboard.addListener("keyboardWillHide", keyboardWillHide);

            return () => {
                mount = false;
                Keyboard.removeListener("keyboardWillShow", keyboardWillShow);
                Keyboard.removeListener("keyboardWillHide", keyboardWillHide);
            };
        },
        []
    );

    useEffect(
        () => {
            if (paddingTop !== 0) {
                scrollToBottom(false);
            }

            return () => {
                mount = false;
            };
        },
        [paddingTop]
    );

    const keyboardWillShow = (p_event: any) => {
        setPaddingTop(p_event.endCoordinates.height - 25);
    };

    const keyboardWillHide = () => {
        setPaddingTop(0);
    };

    function initializeSections(p_contactWithMessages: ContactWithMessages) {
        const groupedMessages = groupMessagesByDay(p_contactWithMessages);
        const keys = Object.keys(groupedMessages);

        const newSections = [];

        for (const key of keys) {
            const messages = groupedMessages[key];

            const section = {
                date: key,
                data: messages
            };

            for (let i = 0; i < messages.length; i++) {
                if (i === messages.length - 1 || messages[i].IsSender !== messages[i + 1].IsSender) {
                    messages[i].LastOfGroup = true;
                }
            }

            newSections.push(section);
        }

        setSections(newSections);
    }

    function groupMessagesByDay(p_contactWithMessages: ContactWithMessages) {
        const dayMessagesMap: { [key: string]: Message[] } = {};

        if (p_contactWithMessages?.Messages?.length > 0) {
            for (const message of p_contactWithMessages.Messages) {
                const messageDate = new Date(message.TstampNanos / 1000000);
                const formattedMessageDate = isToday(messageDate) ?
                    'Today' :
                    messageDate.toLocaleDateString(
                        'en-US',
                        { weekday: 'short', month: 'short', day: 'numeric' }
                    );

                if (!dayMessagesMap[formattedMessageDate]) {
                    dayMessagesMap[formattedMessageDate] = []
                }
                dayMessagesMap[formattedMessageDate].push(message);
            }
        }

        return dayMessagesMap;
    }

    function isToday(p_date: Date) {
        const today = new Date();
        return p_date.getDate() == today.getDate() &&
            p_date.getMonth() == today.getMonth() &&
            p_date.getFullYear() == today.getFullYear()
    }

    function onSendMessage() {
        const contactWithMessages = route.params.contactWithMessages as ContactWithMessages;
        const timeStampNanos = new Date().getTime() * 1000000;

        const message: Message = {
            DecryptedText: messageText,
            EncryptedText: '',
            IsSender: true,
            RecipientPublicKeyBase58Check: contactWithMessages.PublicKeyBase58Check,
            SenderPublicKeyBase58Check: globals.user.publicKey,
            TstampNanos: timeStampNanos,
            LastOfGroup: true
        };

        let todaySection: any;

        if (sections.length > 0 && sections[sections.length - 1].date === 'Today') {
            todaySection = sections[sections.length - 1];

        }

        if (!todaySection) {
            todaySection = {
                date: 'Today',
                data: []
            };
            sections.push(todaySection);
        }

        if (todaySection.data.length > 0) {
            const lastMessage = todaySection.data[todaySection.data.length - 1];
            if (lastMessage.IsSender) {
                lastMessage.LastOfGroup = false;
            }
        }

        todaySection.data.push(message);
        setSections((previous) => sections);

        let messageCopy = messageText;
        setMessageText('');

        api.sendMessage(globals.user.publicKey, contactWithMessages.PublicKeyBase58Check, messageCopy)
            .then(
                async p_response => {
                    const transactionHex = p_response.TransactionHex;
                    const signedTransactionHex = await signing.signTransaction(transactionHex);
                    await api.submitTransaction(signedTransactionHex as string);

                    if (mount) {
                        setChanged(true);
                    }

                    setLocalMessage(globals.user.publicKey, contactWithMessages.PublicKeyBase58Check, p_response.TstampNanos, messageCopy)
                        .then(() => { })
                        .catch(() => { });
                }
            ).catch(p_error => globals.defaultHandleError(p_error));
    }

    function scrollToBottom(p_animated: boolean) {
        if (sectionListRef?.current && sections?.length > 0) {
            const sectionIndex = sections.length - 1;
            const itemIndex = sections[sectionIndex].data.length - 1;
            (sectionListRef.current as any).scrollToLocation({ itemIndex: itemIndex, sectionIndex: sectionIndex, animated: p_animated });
        }
    }


    return isLoading ?
        <View style={[styles.container, themeStyles.containerColorSub]}>
            <ActivityIndicator style={styles.activityIndicator} color={themeStyles.fontColorMain.color}></ActivityIndicator>
        </View>
        :
        <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "position" : "height"}
            keyboardVerticalOffset={65}>
            <View style={[styles.container, themeStyles.containerColorSub, { paddingTop: paddingTop }]}>
                <SectionList
                    ref={sectionListRef}
                    onContentSizeChange={() => scrollToBottom(false)}
                    onScrollToIndexFailed={() => { }}
                    showsVerticalScrollIndicator={false}
                    stickySectionHeadersEnabled={false}
                    sections={sections}
                    keyExtractor={(item, index) => item.SenderPublicKeyBase58Check + item.TstampNanos + index}
                    renderItem={({ item, section }) =>
                        <View style={{ flexDirection: 'row' }}>
                            <MessageComponent message={item}></MessageComponent>
                        </View>
                    }
                    renderSectionHeader={
                        ({ section: { date } }) => {
                            return <View style={[styles.dateContainer, themeStyles.chipColor]}>
                                <Text style={[styles.dateText, themeStyles.fontColorMain]}>{date}</Text>
                            </View>
                        }
                    }
                />
                <View style={[
                    styles.textInputContainer,
                    { height: textInputHeight + 45, backgroundColor: settingsGlobals.darkMode ? themeStyles.containerColorMain.backgroundColor : '#1e2428' }
                ]}>
                    <TextInput
                        style={[
                            styles.textInput,
                            { height: textInputHeight, backgroundColor: settingsGlobals.darkMode ? themeStyles.containerColorSub.backgroundColor : '#33383b' }
                        ]}
                        onContentSizeChange={(p_event) => {
                            if (mount) {
                                setTextInputHeight(
                                    Math.max(Math.min(p_event.nativeEvent.contentSize.height, 100), 35)
                                );
                            }
                        }}
                        onChangeText={setMessageText}
                        value={messageText}
                        blurOnSubmit={false}
                        multiline={true}
                        maxLength={1000}
                        placeholder={'Type a message'}
                        placeholderTextColor={'rgba(241,241,242,0.43)'}
                        keyboardAppearance={settingsGlobals.darkMode ? 'dark' : 'light'}
                    >
                    </TextInput>

                    <TouchableOpacity style={styles.sendButton} onPress={onSendMessage}>
                        <Ionicons name="send" size={32} color="rgba(241,241,242,0.43)" />
                    </TouchableOpacity>
                </View>
            </View>
        </KeyboardAvoidingView>
}

const styles = StyleSheet.create(
    {
        activityIndicator: {
            marginTop: 175
        },
        container: {
            marginTop: 1,
            width: Dimensions.get('window').width,
            height: '100%'
        },
        dateContainer: {
            alignSelf: 'center',
            borderRadius: 8,
            paddingTop: 2,
            paddingBottom: 2,
            paddingRight: 6,
            paddingLeft: 6,
            marginTop: 4,
            marginBottom: 4,
            borderWidth: 1,
            borderColor: 'black'
        },
        dateText: {
            fontSize: 10,
            fontWeight: '700'
        },
        textInputContainer: {
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'flex-end',
            paddingBottom: 36,
            paddingTop: 8
        },
        textInput: {
            minHeight: 35,
            borderRadius: 25,
            marginLeft: 6,
            marginRight: 12,
            paddingRight: 10,
            paddingLeft: 10,
            color: 'white',
            flex: 1,
            fontSize: 16
        },
        sendButton: {
            marginRight: 5
        }
    }
);