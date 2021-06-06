import { settingsGlobals } from '@globals/settingsGlobals'
import { NavigationProp } from '@react-navigation/native';
import { themeStyles } from '@styles/globalColors'
import React, { Component } from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { TouchableOpacity } from 'react-native-gesture-handler'

interface Props {
    navigation: NavigationProp<any>
}

interface State {

}

export class OwnProfileOptionsComponent extends Component<Props, State> {
    handleEditButtonPress = () => {
        this.props.navigation.navigate('EditProfile');
    }
    render() {
        return (
            <View style={styles.container}>
                <TouchableOpacity
                    disabled={false}
                    style={[
                        styles.optionButton,
                        themeStyles.buttonBorderColor,
                        { borderWidth: settingsGlobals.darkMode ? 1 : 0 }
                    ]}
                    activeOpacity={1}
                    onPress={this.handleEditButtonPress}
                >
                    <Text
                        style={styles.optionButtonText}
                    >Edit Profile</Text>
                </TouchableOpacity>
            </View>
        )
    }
}

export default OwnProfileOptionsComponent;

const styles = StyleSheet.create({
    container: {
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'flex-end',
    },
    optionButton: {
        display: 'flex',
        flexDirection: 'column',
        maxWidth: 100,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 2,
        paddingRight: 12,
        paddingLeft: 12,
        paddingTop: 6,
        paddingBottom: 6,
        borderRadius: 4,
        marginBottom: 8,
        backgroundColor: 'black',
    },
    optionButtonText: {
        color: 'white'
    }
})
