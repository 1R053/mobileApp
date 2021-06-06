import { globals } from '@globals/globals';
import { api } from '@services/api';
import React, { Component } from 'react';
import * as ImagePicker from 'expo-image-picker';
import { ActivityIndicator, Image, Platform, StyleSheet, Text, View, TouchableOpacity, TextInput, ScrollView, Alert } from 'react-native';
import { Profile } from '@types';
import { themeStyles } from '@styles/globalColors';
import { ImageInfo } from 'expo-image-picker/build/ImagePicker.types';
import { NavigationProp } from '@react-navigation/core';
import { settingsGlobals } from '@globals/settingsGlobals';
import { signing } from '@services/authorization/signing';

interface Props {
    navigation: NavigationProp<any>
}

interface State {
    profilePic: string,
    username: string,
    description: string,
    founderReward: string,
    loading: boolean
}

export class EditProfileScreen extends Component<Props, State> {
    username = globals.user.username;

    private _isMounted = false;

    constructor(props: Props) {
        super(props);
        this.state = {
            profilePic: '',
            username: '',
            description: '',
            founderReward: '',
            loading: true,
        }

        this.pickImage = this.pickImage.bind(this);
        this.updateProfile = this.updateProfile.bind(this);
        this.handleDescriptionChange = this.handleDescriptionChange.bind(this);
        this.handleFounderRewardsChange = this.handleFounderRewardsChange.bind(this);
    }

    componentDidMount() {
        this.updateNavigation();
        this.loadSingleProfile();
        this._isMounted = true;
    }

    componentWillUnmout() {
        this._isMounted = false;
    }

    updateNavigation = () => {
        this.props.navigation.setOptions({
            headerRight: () => (
                <TouchableOpacity
                    style={[
                        styles.button,
                        themeStyles.buttonBorderColor,
                        { borderWidth: settingsGlobals.darkMode ? 1 : 0, marginTop: 4 }
                    ]}
                    onPress={this.updateProfile}>
                    <Text style={styles.uploadButtonText}>Save</Text>
                </TouchableOpacity>
            ),
            headerTitleStyle: {
                color: themeStyles.fontColorMain.color,
                alignSelf: 'center'
            }
        })
    }

    updateProfile = async () => {
        if (this.state.loading) {
            return;
        }

        const username = this.username.trim();
        if (!username) {
            Alert.alert('Error', 'Please enter a username.');
            return;
        }

        const description = this.state.description.trim();
        if (!description) {
            Alert.alert('Error', 'Please enter a description.');
            return;
        }

        if (!this.state.founderReward.trim()) {
            Alert.alert('Error', 'Please enter a founder reward.');
            return;
        }

        this.setState({ loading: true });

        const founderRewardText = this.state.founderReward.split(',').join('.');
        const founderReward = Number(founderRewardText) * 100;

        api.updateProfile(
            globals.user.publicKey, username, description, this.state.profilePic, founderReward
        ).then(
            async p_response => {
                const transactionHex = p_response.TransactionHex;
                const signedTransaction = await signing.signTransaction(transactionHex);
                await api.submitTransaction(signedTransaction as string).then(
                    () => {
                        if (this._isMounted) {
                            if (globals.user.username !== this.state.username) {
                                globals.user.username = this.state.username;
                            }
                            setTimeout(() => this.props.navigation.navigate('Profile', { profileUpdated: true }), 2000);
                        }
                    },
                    p_error => {
                        if (this._isMounted) {
                            this.setState({ loading: false });
                            globals.defaultHandleError(p_error);
                        }
                    }
                );
            }
        ).catch(
            p_error => {
                if (this._isMounted) {
                    this.setState({ loading: false });

                    const usernameExists = !!p_error?.error && p_error.error.indexOf('Username') !== -1 && p_error.error.indexOF('already exists') !== -1;

                    if (usernameExists) {
                        Alert.alert('Username exists', `The username ${this.state.username} already exists. Please choose a different username.`);
                    } else {
                        globals.defaultHandleError(p_error);
                    }
                }
            }
        )
    }

    pickImage = async () => {
        if (Platform.OS !== 'web') {
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (status !== 'granted') {
                alert('In order to be able to choose one of your images and attach it to your comment, we need access to your photos.');
                return;
            }
        }

        let result = await ImagePicker.launchImageLibraryAsync(
            {
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                quality: 1,
                base64: true
            }
        );

        if (!result.cancelled && result.type === 'image') {
            const base64Image = 'data:image/jpeg;base64,' + (result as ImageInfo).base64 as string;

            if (this._isMounted) {
                this.setState({ profilePic: base64Image })
            }
        }
    };

    loadSingleProfile = async () => {
        const response = await api.getSingleProfile(this.username);
        const newProfile = response.Profile as Profile;

        if (this._isMounted) {
            this.setState(
                {
                    profilePic: newProfile.ProfilePic,
                    username: newProfile.Username,
                    description: newProfile.Description,
                    founderReward: String(newProfile.CoinEntry.CreatorBasisPoints / 100),
                    loading: false
                }
            );
        }
    }

    handleDescriptionChange = (p_text: string) => {
        this.setState({ description: p_text });
    }

    handleFounderRewardsChange = (p_text: string) => {
        const numberText = p_text.split(',').join('.');
        const founderRewardNumber = Number(numberText)

        if (founderRewardNumber >= 0 && founderRewardNumber <= 100) {
            this.setState({ founderReward: p_text });
        }
    }

    render() {
        if (this.state.loading) {
            return (
                <View style={[styles.container, themeStyles.containerColorMain]}>
                    <ActivityIndicator style={styles.activityIndicator} color={themeStyles.fontColorMain.color}></ActivityIndicator>
                </View>
            )
        }

        return (
            <ScrollView style={[styles.scrollView, themeStyles.containerColorMain]}>
                <View style={[styles.container, themeStyles.containerColorMain]}>
                    <View style={[styles.profilePicContainer]}>
                        <Image
                            style={styles.profilePic}
                            source={{ uri: this.state.profilePic ? this.state.profilePic : 'https://i.imgur.com/vZ2mB1W.png' }}>
                        </Image>
                    </View>
                    <TouchableOpacity
                        style={[
                            styles.
                                button,
                            themeStyles.buttonBorderColor,
                            { borderWidth: settingsGlobals.darkMode ? 1 : 0 }
                        ]}
                        onPress={this.pickImage}>
                        <Text style={styles.uploadButtonText}>Change Image</Text>
                    </TouchableOpacity>
                    <View style={[styles.inputContainer]}>
                        <Text style={[themeStyles.fontColorSub]}>Username</Text>
                        <TextInput
                            style={[styles.textInput, themeStyles.fontColorMain, , themeStyles.borderColor]}
                            value={this.state.username}
                            onChangeText={(p_text: string) => {
                                this.setState({ username: p_text })
                            }}
                            keyboardAppearance={settingsGlobals.darkMode ? 'dark' : 'light'}
                        />
                    </View>
                    <View style={[styles.inputContainer]}>
                        <Text style={[themeStyles.fontColorSub]}>Description</Text>
                        <TextInput
                            style={[styles.textInput, themeStyles.fontColorMain, themeStyles.borderColor]}
                            value={this.state.description}
                            multiline={true}
                            maxLength={180}
                            onChangeText={this.handleDescriptionChange}
                            keyboardAppearance={settingsGlobals.darkMode ? 'dark' : 'light'}
                        />
                    </View>
                    <View style={[styles.inputContainer]}>
                        <Text style={[themeStyles.fontColorSub]}>Founder reward percentage</Text>
                        <TextInput
                            style={[styles.textInput, themeStyles.fontColorMain, themeStyles.borderColor]}
                            keyboardType='numeric'
                            value={this.state.founderReward}
                            onChangeText={this.handleFounderRewardsChange}
                            keyboardAppearance={settingsGlobals.darkMode ? 'dark' : 'light'}
                        />
                    </View>
                </View>

                <View style={{ height: 500 }}></View>
            </ScrollView>
        )
    }
}

const styles = StyleSheet.create({
    scrollView: {
        flex: 1
    },
    container: {
        flex: 1,
        alignItems: 'center'
    },
    activityIndicator: {
        marginTop: 175
    },
    profilePicContainer: {
        marginTop: '10%',
        marginBottom: 10,
        marginRight: 10
    },
    profilePic: {
        height: 100,
        width: 100,
        borderRadius: 16,
    },
    button: {
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 10,
        paddingRight: 12,
        paddingLeft: 12,
        paddingTop: 6,
        paddingBottom: 6,
        borderRadius: 4,
        marginBottom: 8,
        backgroundColor: 'black'
    },
    uploadButtonText: {
        color: 'white'
    },
    inputContainer: {
        width: '96%',
        marginTop: 10
    },
    textInput: {
        borderColor: 'gray',
        borderBottomWidth: 1,
        paddingVertical: 4,
        width: '100%',
        marginBottom: 16
    }
})

export default EditProfileScreen
