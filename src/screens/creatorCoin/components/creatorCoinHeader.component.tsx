import React from "react";
import { View, StyleSheet, Image, Text } from 'react-native';
import { CreatorCoinTransaction } from "@types";
import { themeStyles } from "@styles/globalColors";
import { formatNumber } from "@services/helpers";

interface Props {
    username: string;
    profilePic: string;
    isVerified: boolean;
    currentCoinPrice: number;
    creatorCoinTransactions: CreatorCoinTransaction[];
}

interface State {
    absoluteChangeLast24Hours: string;
    percentageChangeLast24Hour: string;
    changeDirection: number;
    formattedCurrentPrice: string;
}

export class CreatorCoinHeaderComponent extends React.Component<Props, State> {

    constructor(props: Props) {
        super(props);

        const { absolutePriceChange, percentagePriceChange } = this.calculateChangeLast24Hours();

        this.state = {
            formattedCurrentPrice: formatNumber(this.props.currentCoinPrice),
            absoluteChangeLast24Hours: formatNumber(absolutePriceChange),
            percentageChangeLast24Hour: percentagePriceChange.toFixed(2),
            changeDirection: percentagePriceChange > 0 ? 1 : -1
        };
    }

    shouldComponentUpdate(p_nextProps: Props) {
        return p_nextProps.creatorCoinTransactions.length !== this.props.creatorCoinTransactions.length;
    }

    calculateChangeLast24Hours(): { absolutePriceChange: number, percentagePriceChange: number } {
        const currentCoinPrice = this.props.currentCoinPrice;
        const creatorCoinTransactions = this.props.creatorCoinTransactions;

        const now = new Date();
        const nowTimeSpanInSeconds = now.getTime() / 1000;
        const last24HoursTimeSpanInSeconds = nowTimeSpanInSeconds - (24 * 60 * 60);

        let coinPriceLast24Hours = 0;
        for (let i = creatorCoinTransactions.length - 1; i >= 0; i--) {
            const transaction = creatorCoinTransactions[i];
            if (transaction.timeStamp < last24HoursTimeSpanInSeconds) {
                coinPriceLast24Hours = transaction.coinPrice;
                break;
            }
        }

        const absolutePriceChange = currentCoinPrice - coinPriceLast24Hours;
        const percentagePriceChange = absolutePriceChange / coinPriceLast24Hours * 100;

        return { absolutePriceChange, percentagePriceChange };
    }

    render() {
        return <View style={[styles.profileListCard, themeStyles.containerColorMain]}>
            <View>
                <Text style={[styles.coinPrice, themeStyles.fontColorMain]}>${this.state.formattedCurrentPrice}</Text>

                <Text>
                    <Text style={[styles.coinPriceChange, { color: this.state.changeDirection === 1 ? '#30c296' : '#e24c4f' }]}
                    >{this.state.changeDirection === 1 ? '+' : ''}
                        {this.state.absoluteChangeLast24Hours} ({this.state.percentageChangeLast24Hour}%) </Text>
                    <Text style={[styles.last24Hours, themeStyles.fontColorSub]}>LAST 24 HOURS</Text>
                </Text>
            </View>

            <Image style={styles.profileImage} source={{ uri: this.props.profilePic }}></Image>
        </View>
    }
}

const styles = StyleSheet.create(
    {
        profileListCard: {
            display: 'flex',
            flexDirection: 'row',
            paddingTop: 16,
            paddingBottom: 16,
            paddingLeft: 10,
            paddingRight: 10
        },
        profileImage: {
            width: 50,
            height: 50,
            borderRadius: 6,
            marginLeft: 'auto'
        },
        coinPrice: {
            fontSize: 26,
            fontWeight: '600',
            marginBottom: 2
        },
        coinPriceChange: {
            fontWeight: '700',
            fontSize: 11
        },
        last24Hours: {
            fontWeight: '700',
            fontSize: 11
        }
    }
);