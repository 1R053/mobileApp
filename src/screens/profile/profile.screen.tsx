import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, ActivityIndicator, Text, SectionList, RefreshControl } from 'react-native';
import { ProfileScreenOptionsComponent } from './profileScreenOptions.component';
import { CreatorCoinHODLerComponent } from '@components/creatorCoinHODLer.component';
import { ProfileNotCompletedComponent } from '@components/profileNotCompleted.component';
import { TabConfig, TabsComponent } from '@components/tabs.component';
import { globals, navigatorGlobals } from '@globals';
import { api, calculateBitCloutInUSD, loadTickersAndExchangeRate } from '@services';
import { CreatorCoinHODLer, DiamondSender, Post, Profile } from '@types';
import { ProfileStats } from './profileStats.component';
import { themeStyles } from '@styles/globalColors';
import { ProfileCard } from './profileCard.component';
import { DiamondSenderComponent } from './diamondSender.component';
import { PostComponent } from '@components/post.component';
import OwnProfileOptionsComponent from './ownProfileOptions.component';
import { useFocusEffect } from '@react-navigation/core';

enum ProfileScreenTab {
    Posts = 'Posts',
    CreatorCoin = 'Creator Coin',
    Stats = 'Stats',
    Diamonds = 'Diamonds'
}

let tempTab = '';
export function ProfileScreen({ navigation, route }: any) {
    let username = route.params?.username;
    if (!username) {
        username = globals.user.username;
    }

    const isLoggedInUser = username === globals.user.username;

    const [isLoading, setLoading] = useState(true);
    const [isLoadingMore, setLoadingMore] = useState(false);
    const [noMorePosts, setNoMorePosts] = useState(false);
    const [noMoreHolders, setNoMoreHolders] = useState(false);
    const [canCreateProfile, setCanCreateProfile] = useState(false);
    const [profile, setProfile] = useState<Profile>({} as Profile);
    const [fullProfile, setFullProfile] = useState<Profile | undefined>(undefined);
    const [diamondSenders, setDiamondSenders] = useState<DiamondSender[] | undefined>(undefined);
    const [coinPrice, setCoinPrice] = useState<number>(0);
    const [refreshing, setRefreshing] = useState(false);
    const [tabs, setTabs] = useState<TabConfig[]>([]);
    const [selectedTab, setSelectedTab] = useState<ProfileScreenTab>(ProfileScreenTab.Posts);
    const [sections, setSections] = useState<any>({});
    const sectionListRef = useRef(null);

    let mount = true;
    let reload = { posts: () => { }, creatorCoin: () => { }, stats: () => { } };

    if (route.params?.deletedPost) {
        const newPosts = profile.Posts.filter((p_post: Post) => p_post.PostHashHex !== route.params.deletedPost);
        profile.Posts = newPosts;

        if (mount) {
            setProfile(profile);
            configureSections(profile, selectedTab);
            route.params.deletedPost = undefined;
        }
    }

    if (!route.params) {
        navigatorGlobals.refreshProfile = () => {
            if (sectionListRef.current) {
                (sectionListRef.current as any).scrollToLocation({ sectionIndex: 0, itemIndex: 0, animated: true, viewPosition: 0 });
            }
        };
    }

    useEffect(
        () => {
            configureTabs();
            loadData();

            return () => {
                mount = false;
            }
        },
        []
    );

    useFocusEffect(
        React.useCallback(
            () => {
                const profileUpdated = route.params?.profileUpdated;

                if (profileUpdated) {
                    username = route.params?.username;
                    if (!username) {
                        username = globals.user.username;
                    }
                    loadData();
                    navigation.setParams({ profileUpdated: false })
                }
            },
            [route.params?.profileUpdated]
        )
    )

    function configureTabs() {
        const newTabs: TabConfig[] = [
            {
                name: ProfileScreenTab.Posts
            },
            {
                name: ProfileScreenTab.CreatorCoin
            },
            {
                name: ProfileScreenTab.Diamonds
            }
        ];

        if (globals.investorFeatures) {
            newTabs.push(
                {
                    name: ProfileScreenTab.Stats
                }
            );
        }

        setTabs(newTabs);
    }

    function loadData() {
        if (mount) {
            setLoading(true);
            setNoMoreHolders(false);
            setNoMorePosts(false);
            setFullProfile(undefined);
            setDiamondSenders(undefined);
        }

        if (!username) {
            if (mount) {
                setLoading(false);
                setCanCreateProfile(false);
                return
            }
        }

        Promise.all(
            [
                loadTickersAndExchangeRate(),
                loadSingleProfile(),
                loadPosts()
            ]
        ).then(
            p_responses => {
                if (mount) {
                    const profile = p_responses[1];
                    profile.Posts = p_responses[2];

                    for (const post of profile.Posts) {
                        post.ProfileEntryResponse = getProfileCopy(profile);
                    }
                    setProfile(p_responses[1]);
                    setSelectedTab(ProfileScreenTab.Posts);
                    configureSections(p_responses[1], ProfileScreenTab.Posts);
                    setLoading(false);
                }
            }
        ).catch(p_error => globals.defaultHandleError(p_error));
    }

    async function loadSingleProfile() {
        const response = await api.getSingleProfile(username);
        const newProfile = response.Profile as Profile;

        if (newProfile) {
            const calculatedCoinPrice = calculateBitCloutInUSD(newProfile.CoinPriceBitCloutNanos);

            if (mount) {
                setCanCreateProfile(true);

                setCoinPrice(calculatedCoinPrice);
            }
        }
        return newProfile;
    }

    async function loadPosts() {
        const response = await api.getProfilePostsBatch(globals.user.publicKey, username, 10);
        let posts = response.Posts as Post[] ?? [];
        posts = posts.filter(p_post => !p_post.IsHidden);
        return posts;
    }

    function configureSections(p_profile: Profile, p_selectedTab: string, p_fullProfile?: Profile | undefined, p_diamondSenders?: DiamondSender[] | undefined) {
        let tabData: any[] = [null];
        let renderItem: any = () => undefined;

        if (p_selectedTab === ProfileScreenTab.Posts) {
            if (p_profile.Posts?.length > 0) {
                tabData = p_profile.Posts;
                renderItem = ({ item }: any) => <PostComponent route={route} navigation={navigation} post={item}></PostComponent>
            } else {
                renderItem = ({ item }: any) => <View style={styles.noPostsContainer}>
                    <Text style={[styles.noPostsText, themeStyles.fontColorSub]}>No posts yet</Text>
                </View>
            }

        } else if (p_selectedTab === ProfileScreenTab.CreatorCoin) {
            if (p_profile.UsersThatHODL) {
                tabData = p_profile.UsersThatHODL;
                renderItem = ({ item }: any) => <CreatorCoinHODLerComponent
                    creatorCoinPrice={coinPrice}
                    userWhoHODL={item}></CreatorCoinHODLerComponent>
            } else {
                renderItem = () => <ActivityIndicator
                    style={{ marginTop: 100 }}
                    color={themeStyles.fontColorMain.color}
                ></ActivityIndicator>
            }
        } else if (p_selectedTab === ProfileScreenTab.Stats) {
            if (!!p_fullProfile) {
                renderItem = () => <ProfileStats
                    profile={p_fullProfile} followers={[]} reload={reload}></ProfileStats>
            } else {
                renderItem = () => <ActivityIndicator
                    style={{ marginTop: 100 }}
                    color={themeStyles.fontColorMain.color}
                ></ActivityIndicator>
            }
        } else if (p_selectedTab === ProfileScreenTab.Diamonds) {
            if (!!p_diamondSenders) {
                tabData = p_diamondSenders;
                renderItem = ({ item }: any) => <DiamondSenderComponent navigation={navigation} diamondSender={item}></DiamondSenderComponent>
            } else {
                renderItem = () => <ActivityIndicator
                    style={{ marginTop: 100 }}
                    color={themeStyles.fontColorMain.color}
                ></ActivityIndicator>
            }
        }

        const newSections = [
            {
                profileCard: true,
                data: [null]
            },
            {
                profileCard: false,
                data: tabData,
                renderItem: renderItem
            }
        ];

        if (mount) {
            setSections(newSections);
        }
    }

    function goToChat() {
        const newProfile: Profile = getProfileCopy(profile);

        navigation.navigate(
            'Chat',
            {
                contactWithMessages: {
                    Messages: [],
                    ProfileEntryResponse: newProfile,
                    NumMessagesRead: 0,
                    PublicKeyBase58Check: newProfile.PublicKeyBase58Check
                },
                loadMessages: true
            }
        );
    }

    async function onTabClick(p_tabName: string) {
        tempTab = p_tabName;
        setSelectedTab(p_tabName as any);

        if (sectionListRef.current) {
            (sectionListRef.current as any).scrollToLocation({ sectionIndex: 1, itemIndex: 0, animated: false, viewPosition: 1 });
        }

        let newFullProfile = fullProfile;
        let newDiamondSenders = diamondSenders;

        if (p_tabName === ProfileScreenTab.CreatorCoin && !profile.UsersThatHODL) {
            configureSections(profile, p_tabName);
            await loadHolders();
        } else if (p_tabName === ProfileScreenTab.Stats && !newFullProfile) {
            configureSections(profile, p_tabName);
            newFullProfile = await loadFullProfile();
        } else if (p_tabName === ProfileScreenTab.Diamonds && !newDiamondSenders) {
            configureSections(profile, p_tabName);
            newDiamondSenders = await loadDiamondSenders();
        }

        if (mount) {
            setProfile(profile);

            if (tempTab === p_tabName) {
                configureSections(profile, p_tabName, newFullProfile, newDiamondSenders);
            }

            if (newFullProfile) {
                setFullProfile(newFullProfile);
            }

            if (newDiamondSenders) {
                setDiamondSenders(newDiamondSenders);
            }
        }
    }

    async function loadHolders() {
        await api.getProfileHolders(
            username, 25
        ).then(
            p_response => {
                const holders = p_response.Hodlers as CreatorCoinHODLer[] ?? [];

                profile.UsersThatHODL = holders;
            }
        ).catch(p_error => globals.defaultHandleError(p_error));
    }

    async function loadFullProfile() {
        const response = await api.getProfilePosts(globals.user.publicKey, username, true);
        const newFullProfile: Profile = response.ProfilesFound[0];

        return newFullProfile;
    }

    async function loadDiamondSenders() {
        const response = await api.getProfileDiamonds(profile.PublicKeyBase58Check);
        const newDiamondSenders: DiamondSender[] = response.DiamondSenderSummaryResponses ?? [];
        return newDiamondSenders;
    }

    async function handleLoadMore() {
        try {
            if (isLoadingMore) {
                return;
            }

            let loading = false;
            if (selectedTab === ProfileScreenTab.Posts) {
                if (!noMorePosts && mount) {
                    loading = true;
                    setLoadingMore(true);
                    await loadMorePosts();
                }
            } else if (selectedTab === ProfileScreenTab.CreatorCoin) {
                if (!noMoreHolders && mount) {
                    loading = true;
                    setLoadingMore(true);
                    await loadMoreHolders();
                }
            }

            if (loading && mount) {
                setProfile(profile);
                configureSections(profile, selectedTab);
                setLoadingMore(false);
            }
        } catch (p_exception) {
        }
    }

    async function loadMorePosts() {
        if (profile.Posts?.length > 0) {
            const lastPostHashHex = profile.Posts[profile.Posts.length - 1].PostHashHex;
            const response = await api.getProfilePostsBatch(globals.user.publicKey, username, 10, lastPostHashHex);

            let newPosts = response.Posts as Post[] ?? [];
            if (newPosts?.length > 0) {
                for (const post of newPosts) {
                    post.ProfileEntryResponse = getProfileCopy(profile);
                }
                newPosts = newPosts.filter(p_post => !p_post.IsHidden);
                profile.Posts = profile.Posts.concat(newPosts);
            } else {
                if (mount) {
                    setNoMorePosts(true);
                }
            }
        }
    }

    async function loadMoreHolders() {
        if (profile.UsersThatHODL && profile.UsersThatHODL.length > 0) {
            const lastPublicKey = profile.UsersThatHODL[profile.UsersThatHODL?.length - 1].HODLerPublicKeyBase58Check;
            const response = await api.getProfileHolders(username, 30, lastPublicKey);
            const holders = response.Hodlers as CreatorCoinHODLer[] ?? [];

            if (holders?.length > 0) {
                profile.UsersThatHODL = profile.UsersThatHODL.concat(holders);
            } else {
                if (mount) {
                    setNoMoreHolders(true);
                }
            }
        }
    }

    function getProfileCopy(p_profile: Profile): Profile {
        const newProfile: Profile = {
            ProfilePic: p_profile.ProfilePic,
            Username: p_profile.Username,
            Description: p_profile.Description,
            PublicKeyBase58Check: p_profile.PublicKeyBase58Check,
            CoinPriceBitCloutNanos: p_profile.CoinPriceBitCloutNanos,
            CoinEntry: p_profile.CoinEntry,
            IsVerified: p_profile.IsVerified,
            Posts: []
        };

        return newProfile;
    }

    const keyExtractor = (item: any, index: number) => {
        if (selectedTab === ProfileScreenTab.Posts) {
            return (item as Post)?.PostHashHex + index.toString();
        } else if (selectedTab === ProfileScreenTab.CreatorCoin) {
            return (item as CreatorCoinHODLer)?.HODLerPublicKeyBase58Check + index.toString();
        } else if (selectedTab === ProfileScreenTab.Diamonds) {
            return (item as DiamondSender)?.SenderPublicKeyBase58Check + index.toString();
        } else {
            return index.toString();
        }
    };

    return isLoading ?
        <View style={[styles.container, themeStyles.containerColorSub]}>
            <ActivityIndicator style={styles.activityIndicator} color={themeStyles.fontColorMain.color}></ActivityIndicator>
        </View>
        :
        canCreateProfile ?
            <View style={styles.container}>
                <SectionList
                    ref={sectionListRef}
                    onScrollToIndexFailed={() => { }}
                    style={themeStyles.containerColorSub}
                    stickySectionHeadersEnabled={true}
                    sections={sections}
                    keyExtractor={keyExtractor}
                    onEndReached={handleLoadMore}
                    onEndReachedThreshold={3}
                    maxToRenderPerBatch={selectedTab === ProfileScreenTab.Posts ? 5 : 20}
                    windowSize={selectedTab === ProfileScreenTab.Posts ? 8 : 20}
                    renderItem={
                        () => <View style={styles.profileCardContainer}>
                            {
                                !isLoggedInUser && !globals.readonly ?
                                    <ProfileScreenOptionsComponent
                                        publicKey={profile.PublicKeyBase58Check}
                                        goToChat={goToChat}
                                    ></ProfileScreenOptionsComponent>
                                    :
                                    <OwnProfileOptionsComponent navigation={navigation} />
                            }
                            <ProfileCard
                                navigation={navigation}
                                profile={profile}
                                coinPrice={coinPrice}
                            ></ProfileCard>
                        </View>
                    }
                    renderSectionHeader={
                        ({ section: { profileCard } }) => {
                            return profileCard ? <View></View> :
                                <TabsComponent
                                    tabs={tabs}
                                    selectedTab={selectedTab}
                                    onTabClick={onTabClick}
                                ></TabsComponent>
                        }
                    }
                    refreshControl={<RefreshControl
                        tintColor={themeStyles.fontColorMain.color}
                        titleColor={themeStyles.fontColorMain.color}
                        refreshing={refreshing}
                        onRefresh={loadData} />}
                    ListFooterComponent={() => isLoadingMore ? <ActivityIndicator color={themeStyles.fontColorMain.color}></ActivityIndicator> : <View></View>}
                />
            </View>
            :
            <ProfileNotCompletedComponent></ProfileNotCompletedComponent>
}

const styles = StyleSheet.create(
    {
        activityIndicator: {
            marginTop: 175
        },
        container: {
            flex: 1
        },
        profileActionsContainer: {
            display: 'flex',
            flexDirection: 'row',
            justifyContent: 'flex-end'
        },
        profileCardContainer: {
            marginRight: 10,
            marginLeft: 10,
            marginTop: 10,
            marginBottom: 8
        },
        noPostsContainer: {
            paddingLeft: 10,
            paddingTop: 10
        },
        noPostsText: {
            fontWeight: '500'
        }
    }
);