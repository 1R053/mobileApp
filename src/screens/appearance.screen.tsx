import React from 'react';
import { Text, View, StyleSheet, Alert } from 'react-native';
import { TouchableOpacity } from 'react-native-gesture-handler';
import * as SecureStore from 'expo-secure-store';
import { constants, globals, settingsGlobals } from '@globals';
import { themeStyles, updateThemeStyles } from '@styles';

export function AppearanceScreen({ navigation }: any) {

    function changeTheme(p_theme: string) {
        const key = globals.user.publicKey + constants.localStorage_appearance;
        settingsGlobals.darkMode = p_theme === 'dark';
        SecureStore.setItemAsync(key, p_theme)
            .then(
                () => {
                    updateThemeStyles();
                    globals.setGlobalTheme(p_theme);
                    Alert.alert('Great!', 'You have changed your theme. Please reload the app in order for the changes to take effect.');
                }
            )
            .catch(p_error => globals.defaultHandleError(p_error));
    }

    return (
        <View style={[styles.container, themeStyles.containerColorSub]}>
            <TouchableOpacity style={[styles.buttonContainer, themeStyles.borderColor, themeStyles.containerColorMain]}
                onPress={() => changeTheme('light')}
                activeOpacity={1}>
                <Text style={[styles.buttonText, themeStyles.fontColorMain]}>Light</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.buttonContainer, themeStyles.borderColor, themeStyles.containerColorMain]}
                onPress={() => changeTheme('dark')}
                activeOpacity={1}>
                <Text style={[styles.buttonText, themeStyles.fontColorMain]}>Dark</Text>
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