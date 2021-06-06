import React from 'react';
import { Dimensions, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { themeStyles } from '@styles';
import { navigatorGlobals, settingsGlobals } from '@globals';

export function SearchHeaderComponent() {
    const navigation = useNavigation();

    return <View style={[styles.container]}>
        <TouchableOpacity onPress={() => navigation.goBack()} activeOpacity={1}>
            <Ionicons name="chevron-back" size={32} color="#007ef5" />
        </TouchableOpacity>
        <View style={[styles.textInputContainer, themeStyles.containerColorSub, themeStyles.borderColor]}>
            <Ionicons style={[styles.searchIcon, themeStyles.fontColorSub]} name="ios-search" size={20} color={themeStyles.fontColorMain.color} />
            <TextInput
                style={[styles.textInput, themeStyles.fontColorMain]}
                onChangeText={navigatorGlobals.searchProfiles}
                blurOnSubmit={true}
                maxLength={50}
                placeholder={'Search'}
                placeholderTextColor={themeStyles.fontColorSub.color}
                keyboardAppearance={settingsGlobals.darkMode ? 'dark' : 'light'}
            >
            </TextInput>
        </View>
    </View>
}

const styles = StyleSheet.create(
    {
        container: {
            flexDirection: 'row',
            alignItems: 'center'
        },
        textInputContainer: {
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            borderBottomWidth: 1,
            width: Dimensions.get('window').width - 50,
            borderRadius: 8,
            paddingLeft: 10,
            paddingRight: 10,
            marginBottom: 6,
            marginTop: 4,
            height: 35
        },
        searchIcon: {
            marginRight: 10
        },
        textInput: {
            flex: 1
        }
    }
);
