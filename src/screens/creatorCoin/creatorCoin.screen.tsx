import React from "react";
import { View, StyleSheet, Text, ActivityIndicator, FlatList } from 'react-native';
import { NavigationProp, RouteProp } from '@react-navigation/native';
import { cloutFeedApi } from "@services/cloutfeedApi";
import { CreatorCoinChartComponent } from "./components/creatorCoinChart.component";
import { themeStyles } from "@styles";
import { CreatorCoinTransaction, Profile } from "@types";
import { CreatorCoinHeaderComponent } from "./components/creatorCoinHeader.component";
import { api } from "@services/api";
import { CreatorCoinTransactionComponent } from "./components/creatorCoinTransaction.component";

type RouteParams = {
    CreatorCoin: {
        publicKey: string;
        username: string;
        profilePic: string;
        isVerified: boolean;
        currentCoinPrice: number;
    }
}

interface Props {
    navigation: NavigationProp<any>;
    route: RouteProp<RouteParams, 'CreatorCoin'>;
}

interface State {
    loading: boolean,
    loadingHistory: boolean;
    loadingMoreHistory: boolean;
    publicKey: string;
    creatorCoinTransactions: CreatorCoinTransaction[];
    profilesMap: { [key: string]: Profile | null };
    historyData: CreatorCoinTransaction[];
}

export class CreatorCoinScreen extends React.Component<Props, State> {

    private readonly _historyBatchSize = 40;
    private _isMounted = false;

    constructor(props: Props) {
        super(props);

        const publicKey = this.props.route.params.publicKey;
        this.state = {
            loading: true,
            loadingHistory: true,
            loadingMoreHistory: false,
            publicKey: publicKey,
            creatorCoinTransactions: [],
            profilesMap: {},
            historyData: []
        };

        cloutFeedApi.getHistoricalCoinPrice(publicKey, 0)
            .then(
                async (p_creatorCoinTransactions: CreatorCoinTransaction[]) => {
                    if (this._isMounted) {
                        this.setState({ creatorCoinTransactions: p_creatorCoinTransactions, loading: false });

                        const creatorCoinTransactionsBatch = p_creatorCoinTransactions.slice(p_creatorCoinTransactions.length - this._historyBatchSize);

                        this.loadProfiles(creatorCoinTransactionsBatch).then(
                            ({ profilesMap, historyData }) => {
                                if (this._isMounted) {
                                    this.setState({ profilesMap, historyData, loadingHistory: false });
                                }
                            }
                        );
                    }
                }
            ).catch(() => { });

        this.loadMoreHistory = this.loadMoreHistory.bind(this);
    }

    componentDidMount() {
        this._isMounted = true;
    }

    componentWillUnmount() {
        this._isMounted = false;
    }

    shouldComponentUpdate(_p_nextProps: Props, p_nextState: State) {
        return p_nextState.loading !== this.state.loading ||
            p_nextState.loadingHistory !== this.state.loadingHistory ||
            p_nextState.loadingMoreHistory !== this.state.loadingMoreHistory ||
            p_nextState.historyData.length !== this.state.historyData.length;
    }

    loadMoreHistory() {
        if (this.state.loadingMoreHistory) {
            return;
        }

        if (this._isMounted) {
            this.setState({ loadingMoreHistory: true });
        }

        const startIndex = Math.max(0, this.state.creatorCoinTransactions.length - this._historyBatchSize - this.state.historyData.length);
        const endIndex = this.state.creatorCoinTransactions.length - this.state.historyData.length;
        const creatorCoinTransactionsBatch = this.state.creatorCoinTransactions.slice(startIndex, endIndex);

        this.loadProfiles(creatorCoinTransactionsBatch).then(
            ({ profilesMap, historyData }) => {

                if (this._isMounted) {
                    this.setState(
                        {
                            profilesMap: profilesMap,
                            historyData: historyData,
                            loadingMoreHistory: false
                        }
                    );
                }
            }
        );
    }

    async loadProfiles(
        p_creatorCoinTransactions: CreatorCoinTransaction[]
    ): Promise<{ profilesMap: { [key: string]: Profile | null }, historyData: CreatorCoinTransaction[] }> {
        const profilesMap: { [key: string]: Profile | null } = Object.assign({}, this.state.profilesMap);
        const historyData: CreatorCoinTransaction[] = this.state.historyData.slice(0);
        const promises: Promise<boolean>[] = [];

        for (let i = p_creatorCoinTransactions.length - 1; i >= 0; i--) {
            historyData.push(p_creatorCoinTransactions[i]);

            const publicKey = p_creatorCoinTransactions[i].transactorPublicKey;
            if (profilesMap[publicKey]) {
                continue;
            }

            profilesMap[publicKey] = null;
            const promise = new Promise<boolean>(
                (p_resolve, _reject) => {
                    api.getSingleProfile('', publicKey).then(
                        p_response => {
                            const profile: Profile = p_response.Profile;
                            if (profile) {
                                profilesMap[publicKey] = profile;
                            }
                            p_resolve(true);
                        }
                    ).catch(() => p_resolve(false))
                }
            );
            promises.push(promise);
        }


        await Promise.all(promises).then(
            () => { }
        );

        return { profilesMap, historyData };
    }

    render() {
        return this.state.loading ?
            <View style={[styles.container, themeStyles.containerColorSub]}>
                <ActivityIndicator style={styles.activityIndicator} color={themeStyles.fontColorMain.color}></ActivityIndicator>
            </View>
            :
            <View style={[styles.container, themeStyles.containerColorMain]}>
                <FlatList
                    style={[styles.container, themeStyles.containerColorMain]}
                    ListHeaderComponent={
                        <>
                            <CreatorCoinHeaderComponent
                                username={this.props.route.params.username}
                                profilePic={this.props.route.params.profilePic}
                                isVerified={this.props.route.params.isVerified}
                                currentCoinPrice={this.props.route.params.currentCoinPrice}
                                creatorCoinTransactions={this.state.creatorCoinTransactions}
                            ></CreatorCoinHeaderComponent>
                            <CreatorCoinChartComponent
                                publicKey={this.state.publicKey}
                                currentCoinPrice={this.props.route.params?.currentCoinPrice}
                                creatorCoinTransactions={this.state.creatorCoinTransactions}
                            ></CreatorCoinChartComponent>
                            <View style={[styles.historyHeader, themeStyles.containerColorSub]}>
                                <Text style={[styles.historyHeaderText, themeStyles.fontColorMain]}>History</Text>
                            </View>
                        </>
                    }
                    data={this.state.loadingHistory ? [{ transactorPublicKey: 'loading' } as CreatorCoinTransaction] : this.state.historyData}
                    keyExtractor={(item, index) => item.transactorPublicKey + index}
                    renderItem={({ item }) =>
                        item.transactorPublicKey === 'loading' ?
                            <ActivityIndicator style={{ marginTop: 100 }} color={themeStyles.fontColorMain.color}></ActivityIndicator>
                            :
                            <CreatorCoinTransactionComponent
                                navigation={this.props.navigation}
                                publicKey={item.transactorPublicKey}
                                creatorCoinTransaction={item}
                                profile={this.state.profilesMap[item.transactorPublicKey]}
                            ></CreatorCoinTransactionComponent>}
                    onEndReached={this.loadMoreHistory}
                />
                {
                    this.state.loadingMoreHistory && !this.state.loadingHistory ? <ActivityIndicator color={themeStyles.fontColorMain.color}></ActivityIndicator> : undefined
                }
            </View>
    }
}

const styles = StyleSheet.create(
    {
        activityIndicator: {
            marginTop: 175
        },
        container: {
            flex: 1
        },
        historyHeader: {
            justifyContent: 'center',
            paddingTop: 6,
            paddingBottom: 6,
            paddingLeft: 10,
            paddingRight: 10
        },
        historyHeaderText: {
            fontWeight: '600'
        }
    }
);