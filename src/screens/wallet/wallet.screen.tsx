import React from "react";
import { View, StyleSheet, ActivityIndicator, RefreshControl, Text, SectionList } from "react-native";
import { globals } from "@globals/globals";
import { themeStyles } from "@styles/globalColors";
import { calculateAndFormatBitCloutInUsd, calculateBitCloutInUSD, loadTickersAndExchangeRate } from "@services/bitCloutCalculator";
import { cache } from "@services/dataCaching";
import { CreatorCoinHODLer } from '@types';
import { TabConfig, TabsComponent } from "@components/tabs.component";
import { CreatorCoinHODLerComponent } from "@components/creatorCoinHODLer.component";
import { formatNumber } from "@services/helpers";
import { navigatorGlobals } from "@globals/navigatorGlobals";

enum WalletTab {
    Purchased = 'Purchased',
    Received = 'Received'
}

interface Section {
    header: boolean;
    data: CreatorCoinHODLer[] | null[];
    renderItem: any;
}

interface Props {

}

interface State {
    isLoading: boolean;
    publicKey: string;
    bitCloutPriceUsd: string;
    balanceBitClout: string;
    balanceUsd: string;
    creatorCoinsTotalValueUsd: string;
    selectedTab: WalletTab;
    usersYouHODL: CreatorCoinHODLer[];
    sections: Section[];
    refreshing: boolean;
}

export class WalletScreen extends React.Component<Props, State> {
    sectionListRef: any;

    private readonly tabs: TabConfig[] = [
        {
            name: WalletTab.Purchased
        },
        {
            name: WalletTab.Received
        }
    ]

    private _isMounted = false;
    constructor(props: Props) {
        super(props);

        this.state = {
            isLoading: true,
            publicKey: '',
            bitCloutPriceUsd: '',
            balanceBitClout: '',
            balanceUsd: '',
            creatorCoinsTotalValueUsd: '',
            selectedTab: WalletTab.Purchased,
            usersYouHODL: [],
            sections: [],
            refreshing: false
        };

        this.loadData();
        this.loadData = this.loadData.bind(this);
        this.onTabClick = this.onTabClick.bind(this);

        navigatorGlobals.refreshWallet = () => {
            if (this.sectionListRef) {
                this.sectionListRef.scrollToLocation({ sectionIndex: 0, itemIndex: 0, animated: true, viewPosition: 0 });
            }
        };
    }

    componentDidMount() {
        this._isMounted = true;
    }

    componentWillUnmount() {
        this._isMounted = false
    }

    shouldComponentUpdate(_nextProps: Props, p_nextSate: State) {
        return p_nextSate.isLoading !== this.state.isLoading ||
            p_nextSate.selectedTab !== this.state.selectedTab;
    }

    loadData() {

        if (this._isMounted) {
            this.setState({ isLoading: true });
        }

        Promise.all(
            [
                loadTickersAndExchangeRate(),
                cache.user.getData(true)
            ]
        ).then(
            p_responses => {
                const user = p_responses[1];
                const bitCloutNanos = 1000000000.0;
                const balanceBitClout = (user.BalanceNanos / bitCloutNanos).toFixed(9);
                const bitCloutPriceUsd = calculateAndFormatBitCloutInUsd(bitCloutNanos);
                const balanceUsd = calculateAndFormatBitCloutInUsd(user.BalanceNanos);

                let usersYouHODL = user.UsersYouHODL as CreatorCoinHODLer[];

                let creatorCoinsTotalValueUsd = 0;

                if (usersYouHODL?.length > 0) {
                    const amountUsdMap: any = {};
                    for (let i = 0; i < usersYouHODL.length; i++) {
                        if (usersYouHODL[i].ProfileEntryResponse) {
                            const userYouHODL = usersYouHODL[i];
                            const amountYouGetIfYouSold = this.bitCloutNanosYouWouldGetIfYouSold(
                                userYouHODL.BalanceNanos,
                                userYouHODL.ProfileEntryResponse.CoinEntry
                            );
                            const amountUsd = calculateBitCloutInUSD(amountYouGetIfYouSold);

                            const coinsAmount = userYouHODL.BalanceNanos / 1000000000;
                            userYouHODL.ProfileEntryResponse.CoinPriceUSD = amountUsd / coinsAmount;

                            creatorCoinsTotalValueUsd += amountUsd;
                            amountUsdMap[userYouHODL.CreatorPublicKeyBase58Check] = amountUsd;
                        }
                    }

                    usersYouHODL.sort(
                        (p_user1, p_user2) => amountUsdMap[p_user1.CreatorPublicKeyBase58Check] > amountUsdMap[p_user2.CreatorPublicKeyBase58Check] ? -1 : 1
                    );
                }

                if (this._isMounted) {
                    this.setState(
                        {
                            isLoading: false,
                            bitCloutPriceUsd,
                            balanceBitClout,
                            balanceUsd,
                            creatorCoinsTotalValueUsd: formatNumber(creatorCoinsTotalValueUsd),
                            usersYouHODL: usersYouHODL,
                            refreshing: false,
                            sections: this.getSections(usersYouHODL, this.state.selectedTab === WalletTab.Purchased)
                        }
                    );
                }
            }
        ).catch(
            p_error => globals.defaultHandleError(p_error)
        );
    }

    bitCloutNanosYouWouldGetIfYouSold(creatorCoinAmountNano: number, coinEntry: any): number {
        const bitCloutLockedNanos = coinEntry.BitCloutLockedNanos;
        const currentCreatorCoinSupply = coinEntry.CoinsInCirculationNanos;

        const bitCloutBeforeFeesNanos =
            bitCloutLockedNanos *
            (
                1 -
                Math.pow(
                    1 - creatorCoinAmountNano / currentCreatorCoinSupply,
                    1 / 0.3333333
                )
            );

        return (
            (bitCloutBeforeFeesNanos * (100 * 100 - 1)) / (100 * 100)
        );
    }

    getSections(p_usersYouHODL: CreatorCoinHODLer[], p_purchased: boolean) {
        const sections: Section[] = [
            {
                header: true,
                data: [null],
                renderItem: undefined
            }
        ];

        const filteredUsersYouHODL = this.filterUsersYouHODL(p_usersYouHODL, p_purchased);
        if (filteredUsersYouHODL?.length > 0) {
            sections.push(
                {
                    header: false,
                    data: filteredUsersYouHODL,
                    renderItem: ({ item }: any) => <CreatorCoinHODLerComponent
                        creatorCoinPrice={(item as CreatorCoinHODLer).ProfileEntryResponse?.CoinPriceUSD}
                        userWhoHODL={item}></CreatorCoinHODLerComponent>
                }
            );
        } else {
            sections.push(
                {
                    header: false,
                    data: [null],
                    renderItem: ({ item }: any) => <Text style={[styles.noCoinsText, themeStyles.fontColorSub]}>
                        You have not {p_purchased ? 'purchased' : 'received'} any creator coins yet.
                    </Text>
                }
            );
        }

        return sections;
    }

    filterUsersYouHODL(p_usersYouHODL: CreatorCoinHODLer[], p_purchased: boolean) {
        return p_usersYouHODL?.filter(
            p_userYouHODL => p_userYouHODL.HasPurchased === p_purchased ||
                (p_purchased && p_userYouHODL.CreatorPublicKeyBase58Check === p_userYouHODL.HODLerPublicKeyBase58Check)
        );
    }

    onTabClick(p_selectedTab: string) {
        const sections = this.getSections(this.state.usersYouHODL, p_selectedTab === WalletTab.Purchased);

        if (this.sectionListRef) {
            this.sectionListRef.scrollToLocation({ sectionIndex: 1, itemIndex: 0, animated: true, viewPosition: 0.5 });
        }

        if (this._isMounted) {
            this.setState(
                {
                    selectedTab: p_selectedTab as any,
                    sections
                }
            );
        }
    }

    render() {
        return <View style={[styles.container, themeStyles.containerColorMain]}>
            {
                this.state.isLoading ?
                    <View style={[styles.container, themeStyles.containerColorMain]}>
                        <ActivityIndicator style={styles.activityIndicator} color={themeStyles.fontColorMain.color}></ActivityIndicator>
                    </View>
                    :
                    <SectionList
                        ref={ref => (this.sectionListRef = ref)}
                        onScrollToIndexFailed={() => { }}
                        style={[styles.container, themeStyles.containerColorMain]}
                        stickySectionHeadersEnabled={true}
                        sections={this.state.sections}
                        keyExtractor={(item, index) => item ? item.CreatorPublicKeyBase58Check + index.toString() : index.toString()}
                        renderItem={
                            () => <>
                                <View style={[styles.bitCloutPriceContainer]}>
                                    <Text style={[styles.bitCloutPriceText, themeStyles.fontColorMain]}>$BitClout Price</Text>
                                    <Text style={[styles.bitCloutPriceText, themeStyles.fontColorMain]}>~${this.state.bitCloutPriceUsd}</Text>
                                </View>

                                <View style={[styles.balanceContainer, themeStyles.containerColorSub]}>
                                    <Text style={[styles.balanceText, themeStyles.fontColorSub]}>Balance</Text>
                                    <Text style={[styles.balanceBitClout, themeStyles.fontColorMain]}>{this.state.balanceBitClout}</Text>
                                    <Text style={[styles.balanceUsd, themeStyles.fontColorMain]}>≈ ${this.state.balanceUsd} USD Value</Text>
                                </View>

                                <View style={[styles.creatorCoinsContainer]}>
                                    <Text style={[styles.bitCloutPriceText, themeStyles.fontColorMain]}>Creator Coins</Text>
                                    <Text style={[styles.bitCloutPriceText, themeStyles.fontColorMain]}>~${this.state.creatorCoinsTotalValueUsd}</Text>
                                </View>
                            </>
                        }
                        renderSectionHeader={
                            ({ section: { header } }) => {
                                return header ? <View></View> :
                                    <TabsComponent
                                        tabs={this.tabs}
                                        selectedTab={this.state.selectedTab}
                                        onTabClick={this.onTabClick}
                                    ></TabsComponent>
                            }
                        }
                        refreshControl={<RefreshControl
                            tintColor={themeStyles.fontColorMain.color}
                            titleColor={themeStyles.fontColorMain.color}
                            refreshing={this.state.refreshing}
                            onRefresh={this.loadData}
                        />}
                    />
            }
        </View>
    }
}


const styles = StyleSheet.create(
    {
        container: {
            flex: 1,
            width: '100%'
        },
        activityIndicator: {
            marginTop: 175
        },
        bitCloutPriceContainer: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            padding: 10
        },
        bitCloutPriceText: {
            fontSize: 16,
            fontWeight: '600'
        },
        balanceContainer: {
            flex: 0,
            padding: 10
        },
        balanceText: {
            fontWeight: '600',
            fontSize: 12,
            marginBottom: 4
        },
        balanceBitClout: {
            fontSize: 30,
            fontWeight: '600'
        },
        balanceUsd: {
            fontWeight: '500'
        },
        creatorCoinsContainer: {
            marginTop: 4,
            padding: 10,
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center'
        },
        noCoinsText: {
            fontWeight: '500',
            paddingLeft: 10,
            paddingRight: 10,
            paddingTop: 10
        }
    }
);