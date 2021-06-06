import React from 'react';
import { Text, View, StyleSheet, Linking } from 'react-native';
import { TouchableOpacity } from 'react-native-gesture-handler';
import { SimpleLineIcons } from '@expo/vector-icons';
import { Ionicons } from '@expo/vector-icons';
import { Feather } from '@expo/vector-icons';
import { AntDesign } from '@expo/vector-icons';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { themeStyles } from '@styles';
import { globals } from '@globals';

export function SettingsScreen({ navigation }: any) {

    return (
        <View style={[styles.container, themeStyles.containerColorSub]}>
            {
                globals.followerFeatures ?
                    <TouchableOpacity
                        style={[styles.buttonContainer, themeStyles.containerColorMain, themeStyles.borderColor]}
                        onPress={() => navigation.navigate('Appearance')}
                        activeOpacity={1}>
                        <Ionicons name="ios-color-palette" size={24} color={themeStyles.fontColorMain.color} />
                        <Text style={[styles.buttonText, themeStyles.fontColorMain]}>Appearance</Text>
                    </TouchableOpacity>
                    : undefined
            }
            <TouchableOpacity
                style={[styles.buttonContainer, themeStyles.containerColorMain, themeStyles.borderColor]}
                onPress={() => Linking.openURL('https://clouttechnologies.com/privacy-policy')}
                activeOpacity={1}>
                <Feather name="lock" size={24} color={themeStyles.fontColorMain.color} />
                <Text style={[styles.buttonText, themeStyles.fontColorMain]}>Privacy Policy</Text>
            </TouchableOpacity>
            <TouchableOpacity
                style={[styles.buttonContainer, themeStyles.containerColorMain, themeStyles.borderColor]}
                onPress={() => Linking.openURL('https://clouttechnologies.com/terms-%26-conditions')}
                activeOpacity={1}>
                <MaterialCommunityIcons name="text-box-check-outline" size={24} color={themeStyles.fontColorMain.color} />
                <Text style={[styles.buttonText, themeStyles.fontColorMain]}>Terms & Conditions</Text>
            </TouchableOpacity>
            <TouchableOpacity
                style={[styles.buttonContainer, themeStyles.containerColorMain, themeStyles.borderColor]}
                onPress={() => Linking.openURL('https://clouttechnologies.com/home')}
                activeOpacity={1}>
                <Ionicons name="mail-unread-outline" size={24} color={themeStyles.fontColorMain.color} />
                <Text style={[styles.buttonText, themeStyles.fontColorMain]}>Contact Us</Text>
            </TouchableOpacity>
            <TouchableOpacity
                style={[styles.buttonContainer, themeStyles.containerColorMain, themeStyles.borderColor]}
                onPress={() => globals.onLogout()}
                activeOpacity={1}>
                <SimpleLineIcons name="logout" size={24} color={themeStyles.fontColorMain.color} />
                <Text style={[styles.buttonText, themeStyles.fontColorMain]}>Logout</Text>
            </TouchableOpacity>
            <TouchableOpacity
                style={[styles.buttonContainer, themeStyles.containerColorMain, themeStyles.borderColor]}
                activeOpacity={1}>
                <AntDesign name="copyright" style={{ marginLeft: 6 }} size={18} color={themeStyles.fontColorMain.color} />
                <Text style={[styles.buttonText, themeStyles.fontColorMain]}>CloutFeed v 1.4.0</Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create(
    {
        container: {
            flex: 1
        },
        buttonContainer: {
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            padding: 16,
            borderBottomWidth: 1
        },
        buttonText: {
            marginLeft: 12,
            fontWeight: '600'
        }
    }
);