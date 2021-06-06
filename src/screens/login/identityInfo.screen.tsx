import React from "react";
import { StyleSheet, View, Text, TouchableOpacity, Linking } from "react-native";
import { FontAwesome } from '@expo/vector-icons';
import { ScrollView } from "react-native-gesture-handler";
import { NavigationProp } from "@react-navigation/core";

interface Props {
    navigation: NavigationProp<any>;
}

interface State {

}

export class IdentityInfoScreen extends React.Component<Props, State> {

    constructor(props: Props) {
        super(props);
    }

    render() {
        return <View style={styles.container}>
            <FontAwesome name="lock" size={60} color="#ebebeb" />
            <Text style={styles.title}>CloutFeed Identity</Text>
            <ScrollView style={styles.scrollView} bounces={false}>
                <Text style={styles.infoText}>
                    <Text>
                        CloutFeed Identity exists to solve the security issues related to BitClout Identity especially on mobile devices. It adds more layers of security to ensure that your seed phrase is completely safe while using CloutFeed.
                    </Text>
                    {'\n\n'}
                    <Text>
                        Of course CloutFeed identity is
                        <Text
                            style={[{ fontWeight: '500', color: '#d1eeff' }]}
                            onPress={() => Linking.openURL('https://github.com/CloutFeed/mobileApp')}
                        > open source </Text>
                        and any one can proof the legitimacy of its operations.
                    </Text>
                    {'\n\n'}
                    <Text>
                        Advantages in a nutshell:
                    </Text>
                    {'\n\n'}
                    1. Your seed phrase is stored encrypted with a random generated key on your device using AES 128 algorithm.
                    {'\n\n'}
                    2. Your seed phrase is stored in the secure storage of your mobile system which adds another layer of encryption and prevents any other app from accessing it.
                    {'\n\n'}
                    3. Your seed phrase is deleted completely from your device when you logout.
                    {'\n\n'}
                    Read this
                    <Text
                        style={[{ fontWeight: '500', color: '#d1eeff' }]}
                        onPress={() => Linking.openURL('https://bitclout.com/posts/c0955605955ca2e4c8f793a57decdaf24a899e71c92870ba136619d4792374e9')}
                    > thread </Text>
                    for more information.
                </Text>
            </ScrollView>
            <TouchableOpacity
                onPress={() => this.props.navigation.navigate('Identity')}
                style={[styles.continueButton]}
                activeOpacity={0.8}
            >
                <Text style={styles.continueButtonText}>Continue</Text>
            </TouchableOpacity>
        </View>
    }
}

const styles = StyleSheet.create(
    {
        container: {
            flex: 1,
            paddingLeft: '10%',
            paddingRight: '10%',
            paddingTop: '5%',
            alignItems: 'center',
            backgroundColor: '#121212',
        },
        title: {
            fontSize: 28,
            fontWeight: '600',
            color: '#ebebeb',
            marginTop: 5,
            marginBottom: 20
        },
        continueButton: {
            backgroundColor: 'black',
            color: 'white',
            alignSelf: 'stretch',
            height: 44,
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: 5,
            borderWidth: 1,
            borderColor: '#404040',
            marginBottom: '20%',
            marginTop: 'auto'
        },
        continueButtonText: {
            color: 'white',
            fontSize: 18,
            fontWeight: '500'
        },
        infoText: {
            color: '#ebebeb'
        },
        scrollView: {
            marginBottom: 20
        }
    }
);