import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Text, View, StyleSheet, SectionList } from 'react-native';
import { themeStyles } from '@styles';
import { globals } from '@globals';
import { api } from '@services';
import { Post } from '@types';
import { PostComponent } from '@components/post.component';

export function PostScreen({ route, navigation }: any) {
    const [isLoading, setLoading] = useState(true);
    const [post, setPost] = useState<Post>({} as any);
    const [isLoadingMore, setLoadingMore] = useState(false);
    const [commentIndex, setCommentIndex] = useState(0);
    const [sections, setSections] = useState<any>({});

    let mount = true;

    const postHashHex = route.params.postHashHex;
    if (route.params.newComment && post?.PostHashHex) {
        const newComments = post.Comments?.length > 0 ? post.Comments : [];
        const newCommentIndex = newComments.findIndex(p_comment => p_comment.PostHashHex === route.params.newComment.PostHashHex);

        if (newCommentIndex === -1) {
            newComments.unshift(route.params.newComment);
        } else {
            newComments.splice(newCommentIndex, 1);
            newComments.unshift(route.params.newComment);
        }

        if (mount) {
            setPost(p_previousPost => ({ ...p_previousPost, Comments: newComments }));
            const sections = [
                {
                    headerPost: true,
                    data: [post]
                },
                {
                    headerPost: false,
                    data: newComments
                }
            ]
            setSections(sections);
        }

        route.params.newComment = undefined;
    }

    useEffect(
        () => {
            if (route.params?.priorityComment) {
                Promise.all(
                    [
                        api.getSinglePost(globals.user.publicKey, postHashHex, false, 0, 20),
                        api.getSinglePost(globals.user.publicKey, route.params?.priorityComment, false, 0, 0)
                    ]
                ).then(
                    p_responses => setPostData(p_responses[0], p_responses[1])
                ).catch(() => navigation.goBack());

            } else {
                api.getSinglePost(globals.user.publicKey, postHashHex, false, 0, 20).then(
                    p_postResponse => {
                        setPostData(p_postResponse);
                    }
                ).catch(() => navigation.goBack());
            }

            return () => {
                mount = false;
            };
        },
        []
    );

    function setPostData(p_response: any, p_priorityComment?: any) {
        if (p_response?.PostFound) {
            const backendPost = p_response.PostFound as Post;
            backendPost.Comments = backendPost.Comments ? backendPost.Comments : [];
            backendPost.Comments = backendPost.Comments.filter(p_comment => !!p_comment.ProfileEntryResponse);

            if (route.params?.newComment && route.params?.newComment.ProfileEntryResponse) {
                const newCommentIndex = backendPost.Comments.findIndex(p_comment => p_comment.PostHashHex === route.params.newComment.PostHashHex);

                if (newCommentIndex === -1) {
                    backendPost.Comments = [route.params.newComment].concat(backendPost.Comments);
                } else {
                    backendPost.Comments.splice(newCommentIndex, 1);
                    backendPost.Comments.unshift(route.params.newComment);
                }

                route.params.newComment = undefined;
            }

            if (p_priorityComment?.PostFound) {
                const priorityPost = p_priorityComment.PostFound as Post;

                if (priorityPost.ProfileEntryResponse) {
                    const priorityPostIndex = backendPost.Comments.findIndex(p_comment => p_comment.PostHashHex === priorityPost.PostHashHex);

                    if (priorityPostIndex === -1) {
                        backendPost.Comments = [priorityPost].concat(backendPost.Comments);
                    } else {
                        backendPost.Comments.splice(priorityPostIndex, 1);
                        backendPost.Comments.unshift(priorityPost);
                    }
                    route.params.priorityComment = undefined;
                }
            }

            if (mount) {
                setPost(backendPost);
                setCommentIndex(backendPost.Comments ? backendPost.Comments.length : 0);
                const sections = [
                    {
                        headerPost: true,
                        data: [backendPost]
                    },
                    {
                        headerPost: false,
                        data: backendPost.Comments
                    }
                ]
                setSections(sections);
                setLoading(false);
            }
        }
    }

    function loadMoreComments() {
        setLoadingMore(true);
        api.getSinglePost(globals.user.publicKey, postHashHex, false, commentIndex, 20).then(
            p_response => {
                const backendPost = p_response.PostFound as Post;
                if (backendPost.Comments?.length > 0) {
                    const newComments = post.Comments.concat(backendPost.Comments);

                    if (mount) {
                        setPost(p_previousPost => ({ ...p_previousPost, Comments: newComments }));

                        const sections = [
                            {
                                headerPost: true,
                                data: [post]
                            },
                            {
                                headerPost: false,
                                data: newComments
                            }
                        ]

                        setSections(sections);
                        setCommentIndex(newComments.length);
                    }
                }

            }
        ).catch(
            p_response => globals.defaultHandleError(p_response)
        ).finally(
            () => {
                if (mount) {
                    setLoadingMore(false);
                }
            }
        );
    }

    return isLoading ?
        <View style={[styles.container, themeStyles.containerColorMain]}>
            <ActivityIndicator style={styles.activityIndicator} color={themeStyles.fontColorMain.color}></ActivityIndicator>
        </View>
        :
        <View style={[styles.container, themeStyles.containerColorMain]}>
            <SectionList
                stickySectionHeadersEnabled={true}
                sections={sections}
                keyExtractor={(item, index) => item.PostHashHex + index}
                renderItem={
                    ({ item, section }) =>
                        <PostComponent
                            route={route}
                            navigation={navigation}
                            post={item}
                            disablePostNavigate={section.headerPost}
                            hideBottomBorder={section.headerPost}></PostComponent>
                }
                renderSectionHeader={
                    ({ section: { headerPost } }) => {
                        return headerPost ? <View></View> :
                            <View style={themeStyles.containerColorSub}>
                                <Text style={[styles.commentsText, themeStyles.fontColorMain]}>Comments</Text>
                            </View>
                    }
                }
                onEndReached={loadMoreComments}
            />
            {
                isLoadingMore ? <ActivityIndicator color={themeStyles.fontColorMain.color}></ActivityIndicator> : undefined
            }
        </View >

}


const styles = StyleSheet.create(
    {
        activityIndicator: {
            marginTop: 175
        },
        container: {
            flex: 1
        },
        commentsText: {
            paddingLeft: 16,
            paddingTop: 6,
            paddingBottom: 6,
            fontWeight: '600'
        }
    }
)