import { NavigationProp } from "@react-navigation/core";
import React from "react";
import { FontAwesome } from '@expo/vector-icons';
import { TouchableOpacity, View, Image, Text, StyleSheet, Dimensions } from 'react-native';
import { DiamondSender } from '@types';
import { themeStyles } from '@styles';
import { calculateAndFormatBitCloutInUsd, getAnonymousProfile } from '@services';

interface Props {
    navigation: NavigationProp<any>;
    diamondSender: DiamondSender;
}

interface State {
    coinPrice: string;
}

export class DiamondSenderComponent extends React.Component<Props, State> {

    constructor(props: Props) {
        super(props);

        if (!this.props.diamondSender.ProfileEntryResponse) {
            this.props.diamondSender.ProfileEntryResponse = getAnonymousProfile(this.props.diamondSender.SenderPublicKeyBase58Check);
        }

        const diamondSenderCoinPriceUSD = calculateAndFormatBitCloutInUsd(
            this.props.diamondSender.ProfileEntryResponse.CoinPriceBitCloutNanos
        );

        this.state = {
            coinPrice: diamondSenderCoinPriceUSD
        };

        this.goToProfile = this.goToProfile.bind(this);
    }

    shouldComponentUpdate(p_nextProps: Props) {
        return this.props.diamondSender?.SenderPublicKeyBase58Check !== p_nextProps.diamondSender?.SenderPublicKeyBase58Check;
    }

    private goToProfile() {
        if (this.props.diamondSender.ProfileEntryResponse &&
            this.props.diamondSender.ProfileEntryResponse.Username !== 'anonymous') {
            (this.props.navigation as any).push(
                'AppNavigator',
                {
                    screen: 'UserProfile',
                    params: {
                        publicKey: this.props.diamondSender.ProfileEntryResponse.PublicKeyBase58Check,
                        username: this.props.diamondSender.ProfileEntryResponse.Username
                    },
                    key: 'Profile_' + this.props.diamondSender.ProfileEntryResponse.PublicKeyBase58Check
                }
            );
        }
    }

    render() {
        return <TouchableOpacity onPress={this.goToProfile} activeOpacity={1}>

            <View style={[styles.diamondSenderCard, themeStyles.containerColorMain, themeStyles.borderColor]}>
                <Image style={styles.profileImage}
                    source={{ uri: this.props.diamondSender.ProfileEntryResponse?.ProfilePic }}></Image>

                <View>
                    <Text style={[styles.username, themeStyles.fontColorMain]}>{this.props.diamondSender.ProfileEntryResponse?.Username}</Text>
                    <View style={[styles.diamondSenderCoinPriceContainer, themeStyles.chipColor]}>
                        <Text style={[styles.diamondSenderCoinPriceText, themeStyles.fontColorMain]}>~${this.state.coinPrice}</Text>
                    </View>
                </View>

                <View style={styles.diamondsContainer}>
                    {
                        Array(this.props.diamondSender.HighestDiamondLevel).fill(0).map(
                            (_i, index) =>
                                <FontAwesome style={{ marginLeft: 1, marginTop: 1 }} name="diamond" size={16} color={themeStyles.diamondColor.color} key={index} />
                        )
                    }
                    <Text style={[styles.totalDiamonds, themeStyles.fontColorMain]}>{this.props.diamondSender.TotalDiamonds}</Text>
                </View>
            </View>
        </TouchableOpacity>
    }
}

const styles = StyleSheet.create(
    {
        activityIndicator: {
            marginTop: 175
        },
        diamondSenderCard: {
            display: 'flex',
            flexDirection: 'row',
            paddingTop: 16,
            paddingBottom: 16,
            paddingLeft: 10,
            paddingRight: 10,
            borderBottomWidth: 1,
            width: Dimensions.get('window').width

        },
        profileImage: {
            width: 40,
            height: 40,
            borderRadius: 6,
            marginRight: 12
        },
        username: {
            fontWeight: '700',
            maxWidth: Dimensions.get('window').width / 2
        },
        diamondSenderCoinPriceContainer: {
            borderRadius: 12,
            paddingRight: 10,
            paddingLeft: 10,
            justifyContent: 'center',
            height: 20,
            alignSelf: 'flex-start',
            marginTop: 6
        },
        diamondSenderCoinPriceText: {
            fontSize: 10,
            fontWeight: '600'
        },
        diamondsContainer: {
            flexDirection: 'row',
            alignItems: 'center',
            marginLeft: 'auto'
        },
        totalDiamonds: {
            marginLeft: 10,
            fontSize: 18,
            fontWeight: '600'
        }
    }
);