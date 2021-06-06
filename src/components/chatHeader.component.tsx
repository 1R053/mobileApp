import { useNavigation } from '@react-navigation/native';
import React from 'react';
import { Dimensions, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MaterialIcons } from '@expo/vector-icons';
import { themeStyles } from '@styles';
import { ContactWithMessages } from '@types';

export function ChatHeaderComponent(
    { contactWithMessages }: { contactWithMessages: ContactWithMessages }
) {
    const navigation = useNavigation();

    function goToProfile() {
        if (
            contactWithMessages.ProfileEntryResponse &&
            contactWithMessages.ProfileEntryResponse.Username !== 'anonymous') {
            (navigation as any).push(
                'AppNavigator',
                {
                    screen: 'UserProfile',
                    params: {
                        publicKey: contactWithMessages.ProfileEntryResponse.PublicKeyBase58Check,
                        username: contactWithMessages.ProfileEntryResponse.Username
                    },
                    key: 'Profile_' + contactWithMessages.ProfileEntryResponse.PublicKeyBase58Check
                }
            );
        }
    }

    return <View style={[styles.container, themeStyles.containerColorMain, themeStyles.borderColor]}>

        <TouchableOpacity onPress={() => navigation.goBack()} activeOpacity={1}>
            <Ionicons name="chevron-back" size={32} color="#007ef5" />
        </TouchableOpacity>

        <TouchableOpacity onPress={goToProfile} activeOpacity={1}>
            <Image style={styles.profileImage}
                source={{ uri: contactWithMessages.ProfileEntryResponse?.ProfilePic }}></Image>
        </TouchableOpacity>

        <TouchableOpacity onPress={goToProfile} activeOpacity={1}>
            <View style={styles.horizontalContainer}>
                <Text style={[styles.username, themeStyles.fontColorMain]}>{contactWithMessages.ProfileEntryResponse?.Username}</Text>
                {
                    contactWithMessages.ProfileEntryResponse?.IsVerified ?
                        <MaterialIcons name="verified" size={16} color="#007ef5" /> : undefined
                }
            </View>
        </TouchableOpacity>
    </View>
}

const styles = StyleSheet.create(
    {
        container: {
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            paddingRight: 10,
            borderBottomWidth: 1,
            width: Dimensions.get('window').width,
            height: 50

        },
        profileImage: {
            width: 30,
            height: 30,
            borderRadius: 6,
            marginRight: 12,
            marginLeft: 12
        },
        username: {
            fontWeight: '700',
            maxWidth: Dimensions.get('window').width / 2,
            marginRight: 6,
            fontSize: 16
        },
        horizontalContainer: {
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center'
        }
    }
);
