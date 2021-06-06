import React from 'react';
import { Linking, Text, View } from 'react-native';
import { TouchableOpacity } from 'react-native-gesture-handler';
import { globalStyles, themeStyles } from '@styles';


export function ProfileNotCompletedComponent() {

    return <View style={[
        globalStyles.profileNotCompletedContainer,
        { backgroundColor: themeStyles.containerColorSub.backgroundColor }
    ]}>
        <Text style={
            [globalStyles.profileNotCompletedText,
            { color: themeStyles.fontColorMain.color }
            ]}
        >Your profile has not been completed yet. Please visit the official website to update your profile.</Text>
        <TouchableOpacity
            style={globalStyles.profileNotCompletedButton}
            onPress={() => Linking.openURL('https://bitclout.com/')}>
            <Text style={{ color: 'white' }}>Go to Website</Text>
        </TouchableOpacity>
    </View>
}
