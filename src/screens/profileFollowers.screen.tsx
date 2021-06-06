import React, { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { ProfileListCardComponent } from '../components/profileListCard.component';
import { globals } from '../globals/globals';
import { Profile, User } from '@types';
import { api, cache, getAnonymousProfile } from '@services';
import { themeStyles } from '@styles';

export function ProfileFollowersScreen({ route }: any) {
    const [isLoading, setLoading] = useState(true);
    const [followersNumber, setFollowersNumber] = useState<number>(0);
    const [followingNumber, setFollowingNumber] = useState<number>(0);
    const [followers, setFollowers] = useState<Profile[]>([]);
    const [following, setFollowing] = useState<Profile[]>([]);
    const [loggedInUserFollowingMap, setLoggedInUserFollowingMap] = useState<{ [key: string]: Profile }>({});
    const [selectedTab, setSelectedTab] = useState<'followers' | 'following'>('followers');
    const [refreshing, setRefreshing] = React.useState(false);
    const [isLoadingMore, setLoadingMore] = useState(false);

    let mount = true;

    useEffect(
        () => {
            loadData();

            return () => {
                mount = false;
            }
        },
        []
    );

    function loadData() {
        if (!route.params) {
            return;
        }

        if (mount) {
            setLoading(true);
        }

        const requests = [
            api.getProfileFollowers('', route.params.username, '', 50),
            api.getProfileFollowing('', route.params.username, '', 50)
        ]

        requests.push(cache.user.getData());

        Promise.all(
            requests
        ).then(
            p_responses => {
                const followers = createProfilesArray(p_responses[0]);
                const following = createProfilesArray(p_responses[1]);

                if (mount) {
                    if (route.params.selectedTab) {
                        setSelectedTab(route.params.selectedTab);
                        route.params.selectedTab = undefined;
                    }

                    setFollowersNumber(p_responses[0].NumFollowers);
                    setFollowingNumber(p_responses[1].NumFollowers);
                    setFollowers(followers);
                    setFollowing(following);

                    setFollowedByUserMap(p_responses[2]);
                    setLoading(false);
                    setRefreshing(false);
                }
            }
        ).catch(
            p_error => globals.defaultHandleError(p_error)
        );
    }

    function setFollowedByUserMap(p_user: User) {
        let followedByUserMap: any = {};

        const followedByUserPublicKeys = p_user.PublicKeysBase58CheckFollowedByUser as string[];

        if (followedByUserPublicKeys?.length > 0) {
            for (let i = 0; i < followedByUserPublicKeys.length; i++) {
                followedByUserMap[followedByUserPublicKeys[i]] = true;
            }
        }

        setLoggedInUserFollowingMap(followedByUserMap);
    }

    function loadMore() {
        if (isLoadingMore) {
            return;
        }

        const targetArray = selectedTab === 'followers' ? followers : following;
        const max = selectedTab === 'followers' ? followersNumber : followingNumber;
        const canLoadMore = targetArray?.length > 0 && max > targetArray.length;

        if (!canLoadMore) {
            return;
        }

        if (mount) {
            setLoadingMore(true);
        }

        const lastPublicKeyBase58Check = targetArray[targetArray.length - 1].PublicKeyBase58Check;

        const backendCall = selectedTab === 'followers' ? api.getProfileFollowers : api.getProfileFollowing;

        backendCall('', route.params.username, lastPublicKeyBase58Check, 50).then(
            p_response => {
                const newValues = createProfilesArray(p_response);

                if (newValues?.length > 0) {
                    const newTargetArray = targetArray.concat(newValues).slice(0, max);

                    if (mount) {
                        if (selectedTab === 'followers') {
                            setFollowers(newTargetArray);
                        } else {
                            setFollowing(newTargetArray);
                        }
                    }
                }
            }
        ).catch(
            () => { }
        ).finally(
            () => {
                if (mount) {
                    setLoadingMore(false);
                }
            }
        );
    }

    function createProfilesArray(p_response: any): Profile[] {
        const profiles: Profile[] = [];

        if (p_response.PublicKeyToProfileEntry) {
            const publicKeys = Object.keys(p_response.PublicKeyToProfileEntry);
            for (const publicKey of publicKeys) {
                if (!!p_response.PublicKeyToProfileEntry[publicKey]) {
                    profiles.push(p_response.PublicKeyToProfileEntry[publicKey]);
                } else {
                    const anonymousProfile = getAnonymousProfile(publicKey);
                    profiles.push(anonymousProfile);
                }
            }
        }

        return profiles;
    }

    return <View style={[styles.container, themeStyles.containerColorSub]}>
        <View style={[styles.tabsContainer, themeStyles.containerColorMain, themeStyles.borderColor]}>
            <TouchableOpacity
                style={[
                    styles.tab,
                    selectedTab === 'followers' ? { borderBottomWidth: 2, borderBottomColor: themeStyles.fontColorMain.color } : {},

                ]}
                activeOpacity={0.7}
                onPress={() => setSelectedTab('followers')}>
                <Text style={[
                    styles.tabText,
                    selectedTab === 'followers' ? styles.selectedTabText : {},
                    selectedTab === 'followers' ? themeStyles.fontColorMain : themeStyles.fontColorSub
                ]}>{followersNumber} Followers</Text>
            </TouchableOpacity>

            <TouchableOpacity
                style={[
                    styles.tab,
                    selectedTab === 'following' ? { borderBottomWidth: 2, borderBottomColor: themeStyles.fontColorMain.color } : {},
                ]}
                activeOpacity={0.7}
                onPress={() => setSelectedTab('following')}>
                <Text style={[
                    styles.tabText,
                    selectedTab === 'following' ? styles.selectedTabText : {},
                    selectedTab === 'following' ? themeStyles.fontColorMain : themeStyles.fontColorSub
                ]}>{followingNumber} Following</Text>
            </TouchableOpacity>
        </View>
        {
            isLoading ?
                (
                    <View style={{ height: 200, justifyContent: 'center' }}>
                        <ActivityIndicator style={{ alignSelf: 'center' }} color={themeStyles.fontColorMain.color} />
                    </View>
                ) :

                <FlatList
                    data={selectedTab === 'followers' ? followers : following}
                    keyExtractor={(item, index) => item.PublicKeyBase58Check + index}
                    renderItem={({ item }) => <ProfileListCardComponent profile={item} isFollowing={!!loggedInUserFollowingMap[item.PublicKeyBase58Check]}></ProfileListCardComponent>}
                    refreshing={refreshing}
                    onRefresh={loadData}
                    onEndReached={loadMore}
                />
        }

        {
            isLoadingMore && !isLoading ? <ActivityIndicator color={themeStyles.fontColorMain.color}></ActivityIndicator> : undefined
        }
    </View>;
}

const styles = StyleSheet.create(
    {
        container: {
            flex: 1
        },
        tabsContainer: {
            display: 'flex',
            flexDirection: 'row',
            justifyContent: 'flex-start',
            alignItems: 'center',
            height: 50,
            borderBottomWidth: 1
        },
        tab: {
            height: 50,
            paddingLeft: 10,
            paddingRight: 10,
            flex: 1,
            textAlign: 'center'
        },
        tabText: {
            fontWeight: '500',
            paddingTop: 15,
            fontSize: 15,
            textAlign: 'center'
        },
        selectedTabText: {
            fontWeight: 'bold',
        }
    }
);