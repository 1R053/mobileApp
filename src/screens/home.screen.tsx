import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, ActivityIndicator, FlatList, RefreshControl } from 'react-native';
import { api, cache, cloutFeedApi, loadTickersAndExchangeRate } from '@services';
import { themeStyles } from '@styles';
import { navigatorGlobals, globals } from '@globals';
import { Post } from '@types';
import { TabConfig, TabsComponent } from '@components/tabs.component';
import { PostComponent } from '@components/post.component';

const postsCountPerLoad = 10;

enum HomeScreenTab {
    Global = 'Global',
    Following = 'Following',
    Recent = 'Recent'
}

export function HomeScreen({ navigation, route }: any) {
    const [isLoading, setLoading] = useState(true);
    const [isLoadingMore, setLoadingMore] = useState(false);
    const [selectedTab, setSelectedTab] = useState<HomeScreenTab>(HomeScreenTab.Global);
    const [tabs, setTabs] = useState<TabConfig[]>([]);
    const [posts, setPosts] = useState<Post[]>();
    const [refreshing, setRefreshing] = React.useState(false);
    const [currentScrollPosition, setCurrentScrollPosition] = React.useState(0);
    const flatListRef = useRef(null);

    let mount = true;

    navigatorGlobals.refreshHome = () => {
        if (currentScrollPosition > 0 || !flatListRef.current) {
            (flatListRef.current as any)?.scrollToOffset({ animated: true, offset: 0 });
        } else {
            refresh();
        }
    };

    if (route.params?.newPost) {
        const newPostFound = posts?.find(p_post => p_post.PostHashHex === route.params.newPost.PostHashHex);

        if (!newPostFound) {
            let newPosts = [route.params.newPost].concat(posts ? posts : []);
            if (mount) {
                setPosts(newPosts);
            }
        }
        route.params.newPost = undefined;
    }

    if (route.params?.blockedUser) {
        const newPosts = posts?.filter(p_post => p_post.ProfileEntryResponse?.PublicKeyBase58Check !== route.params.blockedUser);
        if (mount && newPosts) {
            setPosts(newPosts);
        }
        route.params.blockedUser = undefined;
    }

    if (route.params?.deletedPost) {
        const newPosts = posts?.filter(p_post => p_post.PostHashHex !== route.params.deletedPost);

        if (mount && newPosts) {
            setPosts(newPosts);
        }
        route.params.deletedPost = undefined;
    }

    useEffect(
        () => {
            configureTabs();
            loadTickersAndExchangeRate().then(
                () => {
                    setGlobalPosts();
                }
            );

            return () => {
                mount = false;
            };
        },
        []
    );

    function configureTabs() {
        const newTabs: TabConfig[] = [
            {
                name: HomeScreenTab.Global
            },
            {
                name: HomeScreenTab.Following
            },
            {
                name: HomeScreenTab.Recent
            }
        ];

        setTabs(newTabs);
    }

    async function getPinnedPost(): Promise<Post | undefined> {

        let post: Post | undefined = undefined;

        try {
            const response = await cloutFeedApi.getPinnedPost();

            const pinnedPost = response.pinnedPost;
            if (pinnedPost) {
                const postResponse = await api.getSinglePost(globals.user.publicKey, pinnedPost, false, 0, 0);
                post = postResponse?.PostFound as Post;
            }

        } catch { }

        return post;
    }

    async function setGlobalPosts() {
        if (mount) {
            setLoading(true);
            setSelectedTab(HomeScreenTab.Global);
        }

        const post: Post | undefined = await getPinnedPost();

        api.getGlobalPosts(globals.user.publicKey, postsCountPerLoad).then(
            async p_response => {
                let posts = p_response.PostsFound as Post[];

                if (post) {
                    posts?.unshift(post);
                }

                posts = await processPosts(posts);
                if (mount) {
                    setPosts(posts);
                }
            }
        ).catch(
            p_error => globals.defaultHandleError(p_error)
        ).finally(
            () => {
                if (mount) {
                    setLoading(false);
                    setRefreshing(false);
                }
            }
        );
    }

    function setFollowingPosts() {
        if (mount) {
            setLoading(true);
            setSelectedTab(HomeScreenTab.Following);
        }

        api.getFollowingPosts(globals.user.publicKey, postsCountPerLoad).then(
            async p_response => {
                let posts = p_response.PostsFound as Post[];

                posts = await processPosts(posts);
                if (mount) {
                    setPosts(posts);
                }
            }
        ).catch(
            p_error => globals.defaultHandleError(p_error)
        ).finally(
            () => {
                if (mount) {
                    setLoading(false);
                    setRefreshing(false);
                }
            }
        );
    }

    function setRecentPosts() {
        if (mount) {
            setLoading(true);
            setSelectedTab(HomeScreenTab.Recent);
        }

        api.getRecentPosts(globals.user.publicKey, postsCountPerLoad).then(
            async p_response => {
                let posts = p_response.PostsFound as Post[];

                posts = await processPosts(posts);
                if (mount) {
                    setPosts(posts);
                }
            }
        ).catch(
            p_error => globals.defaultHandleError(p_error)
        ).finally(
            () => {
                if (mount) {
                    setLoading(false);
                    setRefreshing(false);
                }
            }
        );
    }

    async function processPosts(p_posts: Post[]): Promise<Post[]> {
        let posts: Post[] = [];
        if (posts) {
            const user = await cache.user.getData();
            const blockedUsers = user?.BlockedPubKeys ? user.BlockedPubKeys : [];

            posts = p_posts.filter(
                p_post => !!p_post.ProfileEntryResponse &&
                    !p_post.IsHidden &&
                    !blockedUsers[p_post.ProfileEntryResponse.PublicKeyBase58Check] &&
                    !blockedUsers[p_post.RecloutedPostEntryResponse?.ProfileEntryResponse?.PublicKeyBase58Check]
            );
        }

        return posts;
    }

    function loadMorePosts() {
        if (mount) {
            setLoadingMore(true);
        }

        let callback = selectedTab === HomeScreenTab.Global ? api.getGlobalPosts :
            selectedTab === HomeScreenTab.Following ? api.getFollowingPosts : api.getRecentPosts;

        const lastPosHash = posts && posts.length > 0 ? posts[posts.length - 1].PostHashHex : undefined;

        callback(globals.user.publicKey, postsCountPerLoad, lastPosHash).then(
            async p_response => {
                let newPosts = p_response.PostsFound as Post[];

                newPosts = await processPosts(newPosts);

                const allPosts = posts?.concat(newPosts);

                if (mount && allPosts) {
                    setPosts(allPosts);
                    setRefreshing(false);
                }
            }
        ).catch(
            p_error => globals.defaultHandleError(p_error)
        ).finally(
            () => {
                if (mount) {
                    setLoadingMore(false);
                }
            }
        );
    }

    function refresh() {
        loadTickersAndExchangeRate().then(
            () => {
                if (selectedTab === HomeScreenTab.Global) {
                    setGlobalPosts();
                } else if (selectedTab === HomeScreenTab.Following) {
                    setFollowingPosts();
                } else {
                    setRecentPosts();
                }
            }
        );
    }

    function onTabClick(p_tabName: string) {
        if (p_tabName === HomeScreenTab.Global) {
            setGlobalPosts();
        } else if (p_tabName === HomeScreenTab.Following) {
            setFollowingPosts();
        } else {
            setRecentPosts();
        }
    }

    const keyExtractor = (item: any, index: number) => item.PostHashHex + index;
    const renderItem = ({ item }: any) => <PostComponent route={route} navigation={navigation} post={item}></PostComponent>
    return (
        <View style={[styles.container, themeStyles.containerColorMain]}>
            <TabsComponent
                tabs={tabs}
                selectedTab={selectedTab}
                onTabClick={onTabClick}
            ></TabsComponent>
            {
                isLoading ?
                    (
                        <View style={{ height: 200, justifyContent: 'center' }}>
                            <ActivityIndicator style={{ alignSelf: 'center' }} color={themeStyles.fontColorMain.color} />
                        </View>
                    ) :

                    <FlatList
                        ref={flatListRef}
                        onMomentumScrollEnd={p_event => setCurrentScrollPosition((p_event.nativeEvent as any).contentOffset.y)}
                        data={posts}
                        showsVerticalScrollIndicator={false}
                        keyExtractor={keyExtractor}
                        renderItem={renderItem}
                        onEndReached={loadMorePosts}
                        onEndReachedThreshold={3}
                        maxToRenderPerBatch={5}
                        windowSize={8}
                        refreshControl={<RefreshControl
                            tintColor={themeStyles.fontColorMain.color}
                            titleColor={themeStyles.fontColorMain.color}
                            refreshing={refreshing}
                            onRefresh={refresh} />}
                        ListFooterComponent={isLoadingMore && !isLoading ? <ActivityIndicator color={themeStyles.fontColorMain.color}></ActivityIndicator> : undefined}
                    />
            }
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1
    },
});