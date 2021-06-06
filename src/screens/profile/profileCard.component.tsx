import React from "react";
import { View, StyleSheet, Image, Text, Dimensions, ActivityIndicator } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { AntDesign } from '@expo/vector-icons';
import { NavigationProp } from '@react-navigation/native';
import { TouchableOpacity } from 'react-native-gesture-handler';
import { TextWithLinks } from '@components/textWithLinks.component';
import { api, cache, formatNumber } from '@services';
import { eventManager, globals, settingsGlobals } from '@globals';
import { ChangeFollowersEvent, EventType, Profile, User } from '@types';
import { themeStyles } from '@styles';
import ReadMore from "react-native-read-more-text";

interface Props {
    navigation: NavigationProp<any>;
    profile: Profile;
    coinPrice: number;
}

interface State {
    doUserHODL: boolean;
    followersNumber: number | undefined;
    followingNumber: number | undefined;
    founderReward: string;
    formattedCoinPrice: string;
}

export class ProfileCard extends React.Component<Props, State> {

    mount = true;

    private _unsubscribes: any[] = [];

    constructor(props: Props) {
        super(props);

        const founderReward = this.props.profile.CoinEntry.CreatorBasisPoints / 100;
        let formattedFounderReward;
        if (Number.isInteger(founderReward)) {
            formattedFounderReward = founderReward.toString();
        } else {
            formattedFounderReward = founderReward.toFixed(1);
        }

        const formattedCoinPrice = formatNumber(this.props.coinPrice);

        this.state = {
            doUserHODL: false,
            followingNumber: undefined,
            followersNumber: undefined,
            founderReward: formattedFounderReward,
            formattedCoinPrice: formattedCoinPrice
        };

        const unsubscribeIncreaseFollowers = eventManager.addEventListener(
            EventType.IncreaseFollowers,
            (p_event: ChangeFollowersEvent) => {
                if (p_event.publicKey === this.props.profile.PublicKeyBase58Check) {
                    if (this.mount) {
                        this.setState(
                            p_previousState => (
                                {
                                    followersNumber: (p_previousState.followersNumber ?? 0) + 1
                                }
                            )
                        );
                    }
                }
            }
        );

        const unsubscribeDecreaseFollowers = eventManager.addEventListener(
            EventType.DecreaseFollowers,
            (p_event: ChangeFollowersEvent) => {
                if (p_event.publicKey === this.props.profile.PublicKeyBase58Check) {
                    if (this.mount) {
                        this.setState(
                            p_previousState => (
                                {
                                    followersNumber: (p_previousState.followersNumber ?? 1) - 1
                                }
                            )
                        );
                    }
                }
            }
        );

        this._unsubscribes.push(unsubscribeIncreaseFollowers, unsubscribeDecreaseFollowers);

        this.loadFollowers();

        this.goToFollowersScreen = this.goToFollowersScreen.bind(this);
    }

    shouldComponentUpdate(p_nextProps: Props, p_nextState: State) {
        return this.props.profile?.PublicKeyBase58Check !== p_nextProps.profile?.PublicKeyBase58Check ||
            this.state.followersNumber !== p_nextState.followersNumber;
    }

    componentWillUnmount() {
        this.mount = false;
        for (const unsubscribe of this._unsubscribes) {
            unsubscribe();
        }
    }

    private async loadFollowers() {
        const requests = [
            api.getProfileFollowers('', this.props.profile.Username, '', 0),
            api.getProfileFollowing('', this.props.profile.Username, '', 0)
        ];

        if (this.props.profile.PublicKeyBase58Check !== globals.user.publicKey) {
            requests.push(cache.user.getData());
        }

        await Promise.all(requests).then(
            p_responses => {

                let doUserHODL = false;

                if (p_responses.length === 3) {
                    const user: User = p_responses[2];
                    const userHODLs = user.UsersWhoHODLYou?.find(p_user => p_user.HODLerPublicKeyBase58Check === this.props.profile.PublicKeyBase58Check);
                    doUserHODL = !!userHODLs && userHODLs.HasPurchased;
                }

                if (this.mount) {
                    this.setState(
                        {
                            followersNumber: p_responses[0].NumFollowers,
                            followingNumber: p_responses[1].NumFollowers,
                            doUserHODL: doUserHODL
                        }
                    );
                }
            }
        ).catch(
            p_response => globals.defaultHandleError(p_response)
        );
    }

    private goToFollowersScreen(p_selectedTab: string) {
        this.props.navigation.navigate(
            'ProfileFollowers',
            {
                publicKey: this.props.profile.PublicKeyBase58Check,
                username: this.props.profile.Username,
                selectedTab: p_selectedTab
            }
        );
    }

    private goToCreatorCoinScreen() {
        this.props.navigation.navigate(
            'CreatorCoin',
            {
                publicKey: this.props.profile.PublicKeyBase58Check,
                username: this.props.profile.Username,
                profilePic: this.props.profile.ProfilePic,
                isVerified: this.props.profile.IsVerified,
                currentCoinPrice: this.props.coinPrice
            }
        );
    }

    private renderTruncatedText = (handlePress: any) => {
        return (
            <Text
                style={[styles.description, themeStyles.linkColor]}
                onPress={handlePress}
            >
                Read more
            </Text>
        );
    };

    private renderRevealedText = (handlePress: any) => {
        return (
            <Text
                style={[styles.description, themeStyles.linkColor]}
                onPress={handlePress}
            >
                Show less
            </Text>
        );
    };

    render() {
        return (
            <View style={[styles.container, themeStyles.containerColorMain, themeStyles.shadowColor]}>
                <View style={styles.badgesContainer}>
                    {
                        this.state.doUserHODL ?
                            < AntDesign name={'star'} size={16} color={'#ffdb58'} /> : undefined
                    }

                    <View style={[styles.foundRewardContainer, themeStyles.containerColorSub]}>
                        <Text style={[styles.founderRewardText, themeStyles.fontColorMain]}>{this.state.founderReward}
                            <Text style={{ fontSize: 9 }}>%</Text>
                        </Text>
                    </View>
                </View>
                <Image style={styles.profilePic} source={{ uri: this.props.profile.ProfilePic }}></Image>

                <View style={styles.usernameContainer}>
                    <Text style={[styles.username, themeStyles.fontColorMain]} selectable={true}>{this.props.profile.Username}</Text>
                    {
                        this.props.profile.IsVerified ?
                            <MaterialIcons style={{ marginBottom: 2 }} name="verified" size={16} color="#007ef5" /> : undefined
                    }
                </View>

                <View style={styles.description}>
                    <ReadMore
                        numberOfLines={5}
                        renderTruncatedFooter={this.renderTruncatedText}
                        renderRevealedFooter={this.renderRevealedText}
                    >
                        <TextWithLinks
                            style={[styles.description, themeStyles.fontColorSub]}
                            text={this.props.profile.Description}
                        ></TextWithLinks>
                    </ReadMore>
                </View>

                <View style={styles.infoContainer}>
                    <View style={styles.infoTextContainer}>
                        <TouchableOpacity
                            style={styles.infoButton}
                            activeOpacity={1}
                            onPress={() => this.goToFollowersScreen('followers')}>
                            <Text style={[styles.infoTextLabel, themeStyles.fontColorSub]}>Followers</Text>
                            {
                                this.state.followersNumber != null ?
                                    < Text style={[styles.infoTextNumber, themeStyles.fontColorMain]}>{formatNumber(this.state.followersNumber, false)}</Text>
                                    :
                                    <ActivityIndicator color={themeStyles.fontColorMain.color} style={{ marginTop: 4 }}></ActivityIndicator>
                            }
                        </TouchableOpacity>
                    </View>

                    <View style={[styles.infoBorder, { backgroundColor: settingsGlobals.darkMode ? '#3b3b3b' : '#e0e0e0' }]}></View>

                    <View style={styles.infoTextContainer}>
                        <TouchableOpacity
                            style={styles.infoButton}
                            activeOpacity={1}
                            onPress={() => this.goToFollowersScreen('following')}>
                            <Text style={[styles.infoTextLabel, themeStyles.fontColorSub]}>Following</Text>
                            {
                                this.state.followingNumber != null ?
                                    <Text style={[styles.infoTextNumber, themeStyles.fontColorMain]}>{formatNumber(this.state.followingNumber, false)}</Text>
                                    :
                                    <ActivityIndicator color={themeStyles.fontColorMain.color} style={{ marginTop: 4 }}></ActivityIndicator>
                            }
                        </TouchableOpacity>
                    </View>

                    <View style={[styles.infoBorder, { backgroundColor: settingsGlobals.darkMode ? '#3b3b3b' : '#e0e0e0' }]}></View>

                    <View style={styles.infoTextContainer}>
                        <TouchableOpacity
                            style={styles.infoButton}
                            activeOpacity={1}
                            onPress={() => this.goToCreatorCoinScreen()}>
                            <Text style={[styles.infoTextLabel, themeStyles.fontColorSub]}>Coin Price</Text>
                            <Text style={[styles.infoTextNumber, themeStyles.fontColorMain]}>${this.state.formattedCoinPrice}</Text>
                        </TouchableOpacity>
                    </View>

                </View>
            </View >
        );
    }
}

const styles = StyleSheet.create(
    {
        container: {
            alignItems: 'center',
            justifyContent: 'center',
            paddingTop: 5,
            paddingRight: 10,
            paddingLeft: 10,
            borderRadius: 8,
            shadowOffset: {
                width: 0,
                height: 0,
            },
            shadowOpacity: 1,
            shadowRadius: 1
        },
        badgesContainer: {
            marginLeft: 'auto',
            flexDirection: 'row',
            alignItems: 'center'
        },
        profilePic: {
            marginBottom: 16,
            width: 60,
            height: 60,
            borderRadius: 8
        },
        usernameContainer: {
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center'
        },
        username: {
            fontWeight: 'bold',
            marginBottom: 6,
            fontSize: 20,
            marginRight: 6
        },
        description: {
            maxWidth: Dimensions.get('window').width * 0.7,
            fontSize: 12
        },
        infoContainer: {
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-around',
            alignSelf: 'stretch',
            marginTop: 12,
            marginBottom: 12
        },
        infoTextContainer: {
            paddingTop: 16,
            paddingBottom: 16,
            flex: 1,
            alignItems: 'center',
        },
        infoButton: {
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center'
        },
        infoTextNumber: {
            fontSize: 20,
            fontWeight: 'bold'
        },
        infoTextLabel: {
            fontSize: 12,
            marginBottom: 4
        },
        infoBorder: {
            height: 40,
            width: 1
        },
        foundRewardContainer: {
            paddingTop: 5,
            paddingBottom: 5,
            paddingRight: 6,
            paddingLeft: 6,
            borderRadius: 4,
            marginLeft: 6
        },
        founderRewardText: {
            fontSize: 10,
            fontWeight: '700'
        }
    }
);