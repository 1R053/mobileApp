import React, { useEffect, useState } from 'react';
import { Dimensions, StyleSheet, Text, View } from 'react-native';
import { settingsGlobals } from '@globals';
import { getMessageText } from '@services';
import { Message } from '@types';

export function MessageComponent(
    { message }: { message: Message }
) {
    const [messageText, setMessageText] = useState<string>('');
    let mount = true;

    useEffect(
        () => {

            if (message) {
                getMessageText(message).then(
                    p_text => {
                        if (mount) {
                            setMessageText(p_text)
                        }
                    }
                ).catch(() => { });
            }

            return () => {
                mount = false;
            };
        },
        []
    );
    return <View style={[
        styles.messageContainer,
        { backgroundColor: settingsGlobals.darkMode ? '#333333' : '#4d4d4d' },
        message.IsSender ? styles.sentMessage : styles.receivedMessage,
        message.LastOfGroup ? styles.lastOfGroup : {}
    ]}
    >
        <Text style={styles.messageText} selectable>{messageText}</Text>
    </View>
}

const styles = StyleSheet.create(
    {
        messageContainer: {
            paddingTop: 8,
            paddingBottom: 8,
            paddingRight: 8,
            paddingLeft: 8,
            marginTop: 1,
            marginBottom: 2,
            borderRadius: 10
        },
        sentMessage: {
            marginRight: 4,
            maxWidth: Dimensions.get('window').width * 0.8,
            backgroundColor: 'black',
            marginLeft: 'auto',
            borderWidth: 1,
            borderColor: '#4a4a4a'
        },
        receivedMessage: {
            maxWidth: Dimensions.get('window').width * 0.8,
            marginLeft: 4,
            borderWidth: 1,
            borderColor: '#4a4a4a'
        },
        lastOfGroup: {
            marginBottom: 8
        },
        messageText: {
            color: 'white',
            lineHeight: 20
        }
    }
);
