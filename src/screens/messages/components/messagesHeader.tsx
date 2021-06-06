import { useNavigation } from '@react-navigation/native';
import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { FontAwesome, Ionicons } from '@expo/vector-icons';
import { eventManager, globals } from '@globals';
import { themeStyles } from '@styles';
import { EventType } from '@types';

export function MessagesHeaderComponent() {
    const navigation = useNavigation();

    return <View style={[styles.container, themeStyles.containerColorMain, themeStyles.borderColor]}>
        <TouchableOpacity
            style={{ marginRight: 8, paddingRight: 4, paddingLeft: 4 }}
            onPress={() => eventManager.dispatchEvent(EventType.OpenMessagesSettings)}
        >
            <Ionicons name="ios-filter" size={24} color={themeStyles.fontColorMain.color} />
        </TouchableOpacity>
        {
            globals.investorFeatures ?
            <TouchableOpacity
                style={{ marginRight: 8, paddingRight: 4, paddingLeft: 4 }}
                onPress={() => navigation.navigate('MessageTopHoldersOptions')}
            >
                <FontAwesome name="send-o" size={24} color={themeStyles.fontColorMain.color} />
            </TouchableOpacity>
            : undefined
        }
    </View>
}

const styles = StyleSheet.create(
    {
        container: {
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center'
        }
    }
);
