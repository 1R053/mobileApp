import React, { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, View } from 'react-native';
import { ProfileListCardComponent } from '../components/profileListCard.component';
import { globals, navigatorGlobals } from '@globals';
import { Profile, User } from '@types';
import { api, cache, isNumber } from '@services';
import { themeStyles } from '@styles';

let timer: number | undefined = undefined;

let leaderBoardsCopy: Profile[] = [];
let lastUsernamePrefix: string = '';

export function SearchScreen() {
    const [isLoading, setLoading] = useState(true);
    const [profiles, setProfiles] = useState<Profile[]>([]);
    const [loggedInUserFollowingMap, setLoggedInUserFollowingMap] = useState<{ [key: string]: Profile }>({});

    let mount = true;

    navigatorGlobals.searchProfiles = (p_usernamePrefix: string) => {
        lastUsernamePrefix = p_usernamePrefix;
        p_usernamePrefix = p_usernamePrefix.trim();

        if (isNumber(timer)) {
            window.clearTimeout(timer);
        }

        if (!p_usernamePrefix) {
            if (mount) {
                setProfiles(leaderBoardsCopy);
                setLoading(false);
            }
        } else {
            if (mount) {
                setLoading(true);
            }

            timer = window.setTimeout(
                () => {
                    const usernamePrefixCopy = p_usernamePrefix;
                    api.searchProfiles(globals.user.publicKey, p_usernamePrefix).then(
                        p_response => {
                            let foundProfiles = p_response?.ProfilesFound;

                            if (!foundProfiles) {
                                foundProfiles = [];
                            }

                            if (mount && lastUsernamePrefix === usernamePrefixCopy) {
                                setProfiles(foundProfiles);
                                setLoading(false);
                            }

                            timer = undefined;
                        }
                    ).catch(p_error => globals.defaultHandleError(p_error));
                },
                500
            );
        }
    };

    useEffect(
        () => {
            Promise.all(
                [
                    api.getLeaderBoard(globals.user.publicKey),
                    cache.user.getData()
                ]
            ).then(
                p_responses => {
                    let foundProfiles = p_responses[0]?.ProfilesFound;

                    if (!foundProfiles) {
                        foundProfiles = [];
                    }

                    if (mount) {
                        setFollowedByUserMap(p_responses[1]);
                        leaderBoardsCopy = foundProfiles;
                        setProfiles(foundProfiles);
                        setLoading(false);
                    }
                }
            ).catch(p_error => globals.defaultHandleError(p_error));

            return () => {
                mount = false;
                leaderBoardsCopy = [];
            }
        },
        []
    );

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

    return isLoading ?
        <View style={[styles.container, themeStyles.containerColorSub]}>
            <ActivityIndicator style={styles.activityIndicator} color={themeStyles.fontColorMain.color}></ActivityIndicator>
        </View>
        :
        <View style={[styles.container, themeStyles.containerColorSub]}>
            {
                profiles.length > 0 ?
                    <FlatList
                        data={profiles}
                        keyExtractor={(item, index) => item.PublicKeyBase58Check + index}
                        renderItem={({ item }) => <ProfileListCardComponent profile={item} isFollowing={!!loggedInUserFollowingMap[item.PublicKeyBase58Check]}></ProfileListCardComponent>}
                    />
                    :
                    <Text style={[styles.noProfilesText, themeStyles.fontColorSub]}>No results found</Text>
            }
        </View>
}

const styles = StyleSheet.create(
    {
        activityIndicator: {
            marginTop: 175
        },
        container: {
            flex: 1
        },
        noProfilesText: {
            fontWeight: '500',
            marginTop: 10,
            marginLeft: 10
        }
    }
);
