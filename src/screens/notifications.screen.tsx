import React, { useEffect, useState } from 'react';
import { FlatList, Text, View, StyleSheet, Image, ActivityIndicator, Dimensions, RefreshControl, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FontAwesome } from '@expo/vector-icons';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { globals, navigatorGlobals } from '@globals';
import { Notification, NotificationType, Post, Profile } from '@types';
import { api, calculateBitCloutInUSD, formatNumber, getAnonymousProfile, loadTickersAndExchangeRate } from '@services';
import { globalStyles, themeStyles } from '@styles';

export function NotificationsScreen({ navigation }: any) {
    const [isLoading, setLoading] = useState(true);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [profiles, setProfiles] = useState<{ [key: string]: Profile }>({});
    const [posts, setPosts] = useState<{ [key: string]: Post }>({});
    const [refreshing, setRefreshing] = React.useState(false);
    const [isLoadingMore, setLoadingMore] = useState(false);
    const [lastNotificationIndex, setLastNotificationIndex] = useState(-999);
    const [init, setInit] = useState(false);

    let mount = true;

    navigatorGlobals.refreshNotifications = loadNotifications;

    function loadNotifications(p_force = false) {
        if (!init && !p_force) {
            return;
        }

        if (mount) {
            setLoading(true);
        }

        api.getNotifications(globals.user.publicKey, -1, 50)
            .then(
                p_response => {
                    loadTickersAndExchangeRate().then(
                        () => {
                            if (mount) {
                                setNotifications(p_response.Notifications ? p_response.Notifications : []);
                                setProfiles(p_response.ProfilesByPublicKey);
                                setPosts(p_response.PostsByHash);
                                setLoading(false);
                                setRefreshing(false);
                            }
                        }
                    );
                }
            ).catch(p_error => globals.defaultHandleError(p_error));
    }

    function loadMoreNotifications() {
        if (notifications?.length > 0) {
            const newLastNotificationIndex = notifications[notifications.length - 1].Index;

            if (newLastNotificationIndex !== 0) {
                if (mount) {
                    setLoadingMore(true);
                }

                api.getNotifications(globals.user.publicKey, newLastNotificationIndex - 1, 50).then(
                    p_response => {
                        if (mount) {
                            const allNotifications = notifications.concat(p_response.Notifications)
                            setNotifications(allNotifications);
                            setProfiles(p_previousValue => Object.assign(p_previousValue, p_response.ProfilesByPublicKey));
                            setPosts(p_previousValue => Object.assign(p_previousValue, p_response.PostsByHash));
                            setLastNotificationIndex(newLastNotificationIndex);
                            setLoading(false);
                            setRefreshing(false);
                        }
                    }
                ).catch(p_error => globals.defaultHandleError(p_error)).finally(
                    () => {
                        if (mount) {
                            setLoadingMore(false);
                        }
                    }
                );
            }
        }
    }

    useEffect(
        () => {
            setInit(true);
            loadNotifications(true);

            return () => {
                mount = false;
            }
        },
        []
    );

    function goToProfile(p_userKey: string, p_username: string) {
        if (p_username !== 'anonymous') {
            try {
                navigation.navigate(
                    'AppNavigator',
                    {
                        screen: 'UserProfile',
                        params: {
                            publicKey: p_userKey,
                            username: p_username
                        }
                    }
                );
            } catch {
                alert('Something went wrong! Please try again.')
            }
        }
    }

    function goToPost(p_postHashHex: string, p_priorityComment?: string) {
        try {
            navigation.navigate(
                'AppNavigator',
                {
                    screen: 'Post',
                    params: {
                        postHashHex: p_postHashHex,
                        priorityComment: p_priorityComment
                    }
                }
            );
        } catch {
            alert('Something went wrong! Please try again.')
        }
    }

    function getProfile(p_notification: Notification): Profile {
        let profile = profiles[p_notification.Metadata.TransactorPublicKeyBase58Check];
        if (!profile) {
            profile = getAnonymousProfile(p_notification.Metadata.TransactorPublicKeyBase58Check);
        }

        return profile;
    }

    function renderFollowNotification(p_notification: Notification) {
        const profile = getProfile(p_notification);
        const followText = p_notification.Metadata.FollowTxindexMetadata?.IsUnfollow ? 'unfollowed' : 'followed';
        return (
            <TouchableOpacity
                style={[styles.notificationContainer, styles.centerTextVertically, themeStyles.containerColorMain, themeStyles.borderColor]}
                onPress={() => goToProfile(profile.PublicKeyBase58Check, profile.Username)}
                activeOpacity={1}>
                <TouchableOpacity
                    style={styles.centerTextVertically}
                    onPress={() => goToProfile(profile.PublicKeyBase58Check, profile.Username)}
                    activeOpacity={1}>
                    <Image style={styles.profilePic} source={{ uri: profile.ProfilePic }}></Image>
                </TouchableOpacity>

                <View style={[styles.iconContainer, { backgroundColor: '#0377fc' }]}>
                    <MaterialCommunityIcons style={[{ marginLeft: 1 }]} name="account" size={15} color="white" />
                </View>

                <View style={styles.textContainer}>
                    <TouchableOpacity
                        style={styles.centerTextVertically}
                        onPress={() => goToProfile(profile.PublicKeyBase58Check, profile.Username)}
                        activeOpacity={1}>
                        <Text style={[styles.usernameText, themeStyles.fontColorMain]}>{profile.Username} </Text>
                    </TouchableOpacity>

                    <Text style={[globalStyles.fontWeight500, themeStyles.fontColorMain]}>{followText} you</Text>
                </View>
            </TouchableOpacity>
        );
    }

    function renderBasicTransferNotification(p_notification: Notification) {
        const profile = getProfile(p_notification);
        return (
            <TouchableOpacity
                style={[styles.notificationContainer, styles.centerTextVertically, themeStyles.containerColorMain, themeStyles.borderColor]}
                onPress={() => goToProfile(profile.PublicKeyBase58Check, profile.Username)}
                activeOpacity={1}>
                <TouchableOpacity
                    style={styles.centerTextVertically}
                    onPress={() => goToProfile(profile.PublicKeyBase58Check, profile.Username)}
                    activeOpacity={1}>
                    <Image style={styles.profilePic} source={{ uri: profile.ProfilePic }}></Image>
                </TouchableOpacity>

                <View style={[styles.iconContainer, { backgroundColor: '#00803c' }]}>
                    <FontAwesome style={[{ marginLeft: 1 }]} name="dollar" size={14} color="white" />
                </View>

                <View style={styles.textContainer}>
                    <TouchableOpacity
                        style={styles.centerTextVertically}
                        onPress={() => goToProfile(profile.PublicKeyBase58Check, profile.Username)}
                        activeOpacity={1}>
                        <Text style={[styles.usernameText, themeStyles.fontColorMain]}>{profile.Username} </Text>
                    </TouchableOpacity>

                    <Text style={[globalStyles.fontWeight500, themeStyles.fontColorMain]}>sent you BitClout</Text>
                </View>
            </TouchableOpacity>
        );
    }

    function renderLikeNotification(p_notification: Notification) {
        const profile = getProfile(p_notification);
        const likeText = p_notification.Metadata.LikeTxindexMetadata?.IsUnlike ? 'unliked' : 'liked';
        const postHashHex = p_notification.Metadata.LikeTxindexMetadata?.PostHashHex as string;
        const post = posts[postHashHex];

        return (
            <TouchableOpacity
                style={[styles.notificationContainer, styles.centerTextVertically, themeStyles.containerColorMain, themeStyles.borderColor]}
                activeOpacity={1}
                onPress={() => goToPost(postHashHex)}>
                <TouchableOpacity
                    style={styles.centerTextVertically}
                    onPress={() => goToProfile(profile.PublicKeyBase58Check, profile.Username)}
                    activeOpacity={1}>
                    <Image style={styles.profilePic} source={{ uri: profile.ProfilePic }}></Image>
                </TouchableOpacity>

                <View style={[styles.iconContainer, { backgroundColor: '#eb1b0c' }]}>
                    <Ionicons style={[{ marginLeft: 1, marginTop: 1 }]} name={'ios-heart-sharp'} size={13} color={'white'} />
                </View>

                <View style={styles.textContainer}>
                    <TouchableOpacity
                        style={styles.centerTextVertically}
                        onPress={() => goToProfile(profile.PublicKeyBase58Check, profile.Username)}
                        activeOpacity={1}>
                        <Text style={[styles.usernameText, themeStyles.fontColorMain]}>{profile.Username} </Text>
                    </TouchableOpacity>

                    <Text style={[globalStyles.fontWeight500, themeStyles.fontColorMain]}>{likeText} your post: </Text>
                    <Text style={[[styles.postText, themeStyles.fontColorSub]]} numberOfLines={1}>{post?.Body}</Text>

                </View>
            </TouchableOpacity>
        );
    }

    function renderCreatorCoinNotification(p_notification: Notification) {
        const profile = getProfile(p_notification);
        const bitClout = p_notification.Metadata.CreatorCoinTxindexMetadata?.BitCloutToSellNanos as number;

        const usd = calculateBitCloutInUSD(bitClout);
        return (
            <TouchableOpacity
                style={[styles.notificationContainer, styles.centerTextVertically, themeStyles.containerColorMain, themeStyles.borderColor]}
                onPress={() => goToProfile(profile.PublicKeyBase58Check, profile.Username)}
                activeOpacity={1}>
                <TouchableOpacity
                    style={styles.centerTextVertically}
                    onPress={() => goToProfile(profile.PublicKeyBase58Check, profile.Username)}
                    activeOpacity={1}>
                    <Image style={styles.profilePic} source={{ uri: profile.ProfilePic }}></Image>
                </TouchableOpacity>

                <View style={[styles.iconContainer, { backgroundColor: '#00803c' }]}>
                    <FontAwesome style={[{ marginLeft: 1 }]} name="dollar" size={14} color="white" />
                </View>

                <View style={styles.textContainer}>
                    <TouchableOpacity
                        style={styles.centerTextVertically}
                        onPress={() => goToProfile(profile.PublicKeyBase58Check, profile.Username)}
                        activeOpacity={1}>
                        <Text style={[styles.usernameText, themeStyles.fontColorMain]}>{profile.Username} </Text>
                    </TouchableOpacity>

                    <Text style={[globalStyles.fontWeight500, themeStyles.fontColorMain]}>bought </Text>
                    <Text style={[styles.usernameText, themeStyles.fontColorMain]}>~${usd} </Text>
                    <Text style={[globalStyles.fontWeight500, themeStyles.fontColorMain]}>worth of your coin</Text>
                </View>
            </TouchableOpacity>
        );
    }

    function renderCreatorCoinTransferNotification(p_notification: Notification) {
        const profile = getProfile(p_notification);
        const creatorCoinAmount = p_notification.Metadata.CreatorCoinTransferTxindexMetadata?.CreatorCoinToTransferNanos as number;
        const creatorCoinUsername = p_notification.Metadata.CreatorCoinTransferTxindexMetadata?.CreatorUsername as string;
        const diamondLevel = p_notification.Metadata.CreatorCoinTransferTxindexMetadata?.DiamondLevel as number;
        const postHashHex = p_notification.Metadata.CreatorCoinTransferTxindexMetadata?.PostHashHex as string;
        const post = posts[postHashHex];

        const formattedCreatorCoinAmount = formatNumber(creatorCoinAmount / 1000000000, true, 6);
        return (
            <TouchableOpacity
                style={[styles.notificationContainer, styles.centerTextVertically, themeStyles.containerColorMain, themeStyles.borderColor]}
                onPress={() => diamondLevel === 0 ? goToProfile(profile.PublicKeyBase58Check, profile.Username) : goToPost(postHashHex)}
                activeOpacity={1}>
                <TouchableOpacity
                    style={styles.centerTextVertically}
                    onPress={() => goToProfile(profile.PublicKeyBase58Check, profile.Username)}
                    activeOpacity={1}>
                    <Image style={styles.profilePic} source={{ uri: profile.ProfilePic }}></Image>
                </TouchableOpacity>

                {
                    diamondLevel === 0 ?
                        <View style={[styles.iconContainer, { backgroundColor: '#00803c' }]}>
                            <FontAwesome name="send" size={12} color="white" />
                        </View>
                        :
                        <View style={[styles.iconContainer, { backgroundColor: '#00803c' }]}>
                            <FontAwesome style={{ marginLeft: 1, marginTop: 1 }} name="diamond" size={12} color="white" />
                        </View>
                }

                <View style={styles.textContainer}>
                    <TouchableOpacity
                        style={styles.centerTextVertically}
                        onPress={() => goToProfile(profile.PublicKeyBase58Check, profile.Username)}
                        activeOpacity={1}>
                        <Text style={[styles.usernameText, themeStyles.fontColorMain]}>{profile.Username} </Text>
                    </TouchableOpacity>

                    {
                        diamondLevel > 0 ?
                            <>
                                <Text style={[globalStyles.fontWeight500, themeStyles.fontColorMain]}>gave your post </Text>
                                <Text style={[styles.usernameText, themeStyles.fontColorMain]}>
                                    {diamondLevel} {diamondLevel === 1 ? 'diamond' : 'diamonds'}: </Text>
                                <Text style={[styles.postText, themeStyles.fontColorSub]} numberOfLines={1}> {post?.Body}</Text>
                            </>
                            :
                            <Text>
                                <Text style={[globalStyles.fontWeight500, themeStyles.fontColorMain]}>sent you </Text>
                                <Text style={[styles.usernameText, themeStyles.fontColorMain]}>{formattedCreatorCoinAmount} </Text>
                                <Text style={[styles.usernameText, themeStyles.fontColorMain]}>{creatorCoinUsername} </Text>
                                <Text style={[globalStyles.fontWeight500, themeStyles.fontColorMain]}>coins</Text>
                            </Text>
                    }
                </View>
            </TouchableOpacity>
        );
    }

    function renderSubmitPostNotification(p_notification: Notification) {
        const postHashHex = p_notification.Metadata.SubmitPostTxindexMetadata?.PostHashBeingModifiedHex as string;
        const post = posts[postHashHex];
        if (!post) {
            return undefined;
        }

        if (post.RecloutedPostEntryResponse) {
            return renderPostRecloutNotification(p_notification);
        } else {
            const parentPostHashHex = p_notification.Metadata.SubmitPostTxindexMetadata?.ParentPostHashHex;

            if (parentPostHashHex) {
                const parentPost = posts[parentPostHashHex];

                if (parentPost && parentPost.ProfileEntryResponse.PublicKeyBase58Check === globals.user.publicKey) {
                    return renderPostReplyNotification(p_notification);
                } else {
                    return renderPostMentionNotification(p_notification, true);
                }
            } else {
                return renderPostMentionNotification(p_notification, false);
            }
        }
    }

    function renderPostRecloutNotification(p_notification: Notification) {
        const profile = getProfile(p_notification);

        const postHashHex = p_notification.Metadata.SubmitPostTxindexMetadata?.PostHashBeingModifiedHex as string;
        const post = posts[postHashHex];

        return (
            <TouchableOpacity
                style={[styles.notificationContainer, styles.centerTextVertically, themeStyles.containerColorMain, themeStyles.borderColor]}
                activeOpacity={1}
                onPress={() => goToPost(postHashHex, undefined)}>
                <TouchableOpacity
                    style={styles.centerTextVertically}
                    onPress={() => goToProfile(profile.PublicKeyBase58Check, profile.Username)}
                    activeOpacity={1}>
                    <Image style={styles.profilePic} source={{ uri: profile.ProfilePic }}></Image>
                </TouchableOpacity>

                <View style={[styles.iconContainer, { backgroundColor: '#5ba358' }]}>
                    <FontAwesome style={{ marginLeft: 1 }} name="retweet" size={13} color="white" />
                </View>

                <View style={styles.textContainer}>
                    <TouchableOpacity
                        style={styles.centerTextVertically}
                        onPress={() => goToProfile(profile.PublicKeyBase58Check, profile.Username)}
                        activeOpacity={1}>
                        <Text style={[styles.usernameText, themeStyles.fontColorMain]}>{profile.Username} </Text>
                    </TouchableOpacity>

                    <Text style={[globalStyles.fontWeight500, themeStyles.fontColorMain]}>reclouted your post: </Text>
                    <Text style={[styles.postText, themeStyles.fontColorSub]} numberOfLines={1}>{post?.RecloutedPostEntryResponse?.Body}</Text>
                </View>
            </TouchableOpacity>
        );
    }

    function renderPostMentionNotification(p_notification: Notification, p_withParentPost: boolean) {
        const profile = getProfile(p_notification);

        let parentPoshHashHex: string;
        let postHashHex: string;
        let post: Post;

        if (p_withParentPost) {
            parentPoshHashHex = p_notification.Metadata.SubmitPostTxindexMetadata?.ParentPostHashHex as string;
            postHashHex = p_notification.Metadata.SubmitPostTxindexMetadata?.PostHashBeingModifiedHex as string;
            post = posts[postHashHex];
        } else {
            parentPoshHashHex = p_notification.Metadata.SubmitPostTxindexMetadata?.PostHashBeingModifiedHex as string;
            post = posts[parentPoshHashHex];
        }

        return (
            <TouchableOpacity
                style={[styles.notificationContainer, styles.centerTextVertically, themeStyles.containerColorMain, themeStyles.borderColor]}
                activeOpacity={1}
                onPress={() => goToPost(parentPoshHashHex, postHashHex)}>
                <TouchableOpacity
                    style={styles.centerTextVertically}
                    onPress={() => goToProfile(profile.PublicKeyBase58Check, profile.Username)}
                    activeOpacity={1}>
                    <Image style={styles.profilePic} source={{ uri: profile.ProfilePic }}></Image>
                </TouchableOpacity>

                <View style={[styles.iconContainer, { backgroundColor: '#fcba03' }]}>
                    <FontAwesome style={[{ marginLeft: 1 }]} name="commenting" size={12} color="white" />
                </View>

                <View style={styles.textContainer}>
                    <TouchableOpacity
                        style={styles.centerTextVertically}
                        onPress={() => goToProfile(profile.PublicKeyBase58Check, profile.Username)}
                        activeOpacity={1}>
                        <Text style={[styles.usernameText, themeStyles.fontColorMain]}>{profile.Username} </Text>
                    </TouchableOpacity>

                    <Text style={[globalStyles.fontWeight500, themeStyles.fontColorMain]}>mentioned you in a post: </Text>
                    <Text style={[styles.postText, themeStyles.fontColorSub]} numberOfLines={1}>{post?.Body}</Text>
                </View>
            </TouchableOpacity>
        );
    }

    function renderPostReplyNotification(p_notification: Notification) {
        const profile = getProfile(p_notification);

        const parentPoshHashHex = p_notification.Metadata.SubmitPostTxindexMetadata?.ParentPostHashHex as string;
        const postHashHex = p_notification.Metadata.SubmitPostTxindexMetadata?.PostHashBeingModifiedHex as string;
        const post = posts[postHashHex];

        return (
            <TouchableOpacity
                style={[styles.notificationContainer, styles.centerTextVertically, themeStyles.containerColorMain, themeStyles.borderColor]}
                activeOpacity={1}
                onPress={() => goToPost(parentPoshHashHex, postHashHex)}>
                <TouchableOpacity
                    style={styles.centerTextVertically}
                    onPress={() => goToProfile(profile.PublicKeyBase58Check, profile.Username)}
                    activeOpacity={1}>
                    <Image style={styles.profilePic} source={{ uri: profile.ProfilePic }}></Image>
                </TouchableOpacity>

                <View style={[styles.iconContainer, { backgroundColor: '#3599d4' }]}>
                    <FontAwesome style={[{ marginLeft: 1 }]} name="comment" size={12} color="white" />
                </View>

                <View style={styles.textContainer}>
                    <TouchableOpacity
                        style={styles.centerTextVertically}
                        onPress={() => goToProfile(profile.PublicKeyBase58Check, profile.Username)}
                        activeOpacity={1}>
                        <Text style={[styles.usernameText, themeStyles.fontColorMain]}>{profile.Username} </Text>
                    </TouchableOpacity>

                    <Text style={[globalStyles.fontWeight500, themeStyles.fontColorMain]}>replied to your post: </Text>
                    <Text style={[styles.postText, themeStyles.fontColorSub]} numberOfLines={1}>{post?.Body}</Text>
                </View>
            </TouchableOpacity>
        );
    }

    function renderNotification(p_notification: Notification): any {
        if (p_notification?.Metadata) {
            switch (p_notification.Metadata.TxnType) {
                case NotificationType.Follow:
                    return renderFollowNotification(p_notification);
                case NotificationType.BasicTransfer:
                    return renderBasicTransferNotification(p_notification);
                case NotificationType.Like:
                    return renderLikeNotification(p_notification);
                case NotificationType.CreatorCoin:
                    return renderCreatorCoinNotification(p_notification);
                case NotificationType.CreatorCoinTransfer:
                    return renderCreatorCoinTransferNotification(p_notification);
                case NotificationType.SubmitPost:
                    return renderSubmitPostNotification(p_notification);
                default:
                    return undefined;
            }
        }

        return undefined;
    }

    const keyExtractor = (item: any, index: number) => item.Index?.toString() + index.toString();
    return isLoading ?
        <View style={[styles.listContainer, themeStyles.containerColorMain]}>
            <ActivityIndicator style={styles.activityIndicator} color={themeStyles.fontColorMain.color}></ActivityIndicator>
        </View>
        :
        globals.readonly ?
            <View style={[{ alignItems: 'center', justifyContent: 'center' }, styles.listContainer, themeStyles.containerColorSub]}>
                <Text style={[themeStyles.fontColorMain]}>Notifications are not available in the read-only mode.</Text>
            </View>
            :
            <View style={[styles.listContainer, themeStyles.containerColorSub]}>
                <FlatList
                    data={notifications}
                    keyExtractor={keyExtractor}
                    renderItem={({ item }) => renderNotification(item)}
                    onEndReached={loadMoreNotifications}
                    onEndReachedThreshold={4}
                    maxToRenderPerBatch={20}
                    windowSize={20}
                    refreshControl={<RefreshControl
                        tintColor={themeStyles.fontColorMain.color}
                        titleColor={themeStyles.fontColorMain.color}
                        refreshing={refreshing}
                        onRefresh={loadNotifications} />}
                    ListFooterComponent={() => isLoadingMore ? <ActivityIndicator color={themeStyles.fontColorMain.color}></ActivityIndicator> : <View></View>}

                />
            </View>
}

const styles = StyleSheet.create(
    {
        activityIndicator: {
            marginTop: 175
        },
        listContainer: {
            flex: 1,
            width: Dimensions.get('window').width
        },
        notificationContainer: {
            height: 65,
            paddingLeft: 10,
            paddingRight: 10,
            borderBottomWidth: 1,
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            width: Dimensions.get('window').width
        },
        centerTextVertically: {
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center'
        },
        textContainer: {
            display: 'flex',
            flexDirection: 'row',
            flexWrap: 'wrap',
            alignItems: 'center',
            width: Dimensions.get('window').width - 74
        },
        profilePic: {
            width: 40,
            height: 40,
            borderRadius: 6,
            marginRight: 12
        },
        usernameText: {
            fontWeight: '700'
        },
        iconContainer: {
            position: 'absolute',
            left: 35,
            bottom: 4,
            borderRadius: 20,
            width: 20,
            height: 20,
            alignItems: 'center',
            justifyContent: 'center',
            shadowColor: "#000",
            shadowOffset: {
                width: 0,
                height: 2,
            },
            shadowOpacity: 0.23,
            shadowRadius: 2.62,
            elevation: 4,
        },
        postText: {
            marginTop: 4,
            fontWeight: '500'
        }
    }
);