import React, { useEffect, useState } from 'react';
import { Text, View, StyleSheet, ActivityIndicator, Linking, Alert, Platform } from 'react-native';
import { TouchableOpacity } from 'react-native-gesture-handler';
import { globals } from '@globals';
import { api, cache } from '@services';
import { themeStyles, globalStyles } from '@styles';
import { CreatePostComponent } from '@components/createPost.component';
import { Post, Profile } from '@types';
import { signing } from '@services/authorization/signing';
const mime = require('mime');

export function CreatePostScreen({ navigation, route }: any) {
    const [isLoading, setLoading] = useState(true);
    const [canCreateProfile, setCanCreateProfile] = useState(false);
    const [profile, setProfile] = useState({} as Profile);
    const [postText, setPostText] = useState('');
    const [videoLink, setVideoLink] = useState('');
    const [imagesBase64, setImagesBase64] = useState<string[]>([]);
    const [recloutedPostEntry, setRecloutedPostEntry] = useState<Post>();

    const { newPost, comment, reclout, editPost, parentPost, recloutedPost, editedPost }: {
        newPost: boolean, comment: boolean, reclout: boolean, editPost: boolean, parentPost: Post, recloutedPost: Post, editedPost: Post
    } = route.params;

    let mount = true;

    globals.createPost = async () => {
        if (!canCreateProfile) {
            return;
        }

        let images = imagesBase64 ?? [];

        if (postText || ((reclout || !!editedPost?.RecloutedPostEntryResponse) && images.length === 0 && !videoLink)) {
            if (mount) {
                setLoading(true);
            }

            let imageUrls: string[] = [];
            if (editPost) {
                imageUrls = images.filter(p_image => editedPost.ImageURLs.indexOf(p_image) !== -1)
                images = images.filter(p_image => editedPost.ImageURLs.indexOf(p_image) === -1);
            }

            const files = images.map(
                p_image => {
                    const fileName = p_image.split("/").pop();
                    const newImageUri = Platform.OS === "android" ? p_image : p_image.replace('file://', '');
                    const imageType = mime.getType(newImageUri);
                    return {
                        name: fileName,
                        type: imageType,
                        uri: newImageUri
                    };
                }
            );

            try {
                const jwt = await signing.signJWT();
                if (jwt) {
                    const promises = files.map(p_file => Platform.OS === "android" ? api.uploadImageAndroid(globals.user.publicKey, jwt, p_file) : api.uploadImage(globals.user.publicKey, jwt, p_file));
                    const responses = await Promise.all(promises);
                    imageUrls = imageUrls.concat(responses.map(p_response => p_response.ImageURL));
                    fnCreatePost(postText, imageUrls)
                } else {
                    if (mount) {
                        setLoading(false);
                    }
                    Alert.alert('Error', 'Something went wrong! Please try again.');
                }
            } catch (p_exception) {
                if (mount) {
                    setLoading(false);
                }
                globals.defaultHandleError(p_exception);
            }
        } else {
            alert('Write something before you post!');
        }
    };

    function fnCreatePost(p_text: string, p_imageUrls: string[]) {
        let recloutedPostHashHex = '';
        let parentPostHashHex = '';

        if (editPost) {
            recloutedPostHashHex = editedPost?.RecloutedPostEntryResponse?.PostHashHex;
            parentPostHashHex = editedPost?.ParentStakeID;
        } else {
            recloutedPostHashHex = recloutedPost?.PostHashHex;
            parentPostHashHex = parentPost?.PostHashHex;
        }

        api.createPost(
            globals.user.publicKey, p_text, p_imageUrls, parentPostHashHex, recloutedPostHashHex, editedPost?.PostHashHex, videoLink
        ).then(
            async p_response => {
                const transactionHex = p_response.TransactionHex;
                const signedTransaction = await signing.signTransaction(transactionHex);
                await api.submitTransaction(signedTransaction as string).then(
                    p_response => {
                        if (newPost || reclout) {
                            handleNewPostSuccess(p_response);
                        } else if (comment) {
                            handleCommentSuccess(p_response);
                        } else if (editPost) {
                            if (editedPost.ParentStakeID) {
                                handleCommentSuccess(p_response);
                            } else {
                                handleNewPostSuccess(p_response);
                            }
                        }
                    },
                    p_error => {
                        globals.defaultHandleError(p_error);

                        if (mount) {
                            setLoading(false);
                        }
                    }
                );
            }
        ).catch(
            p_error => {
                globals.defaultHandleError(p_error);

                if (mount) {
                    setLoading(false);
                }
            }
        );
    }

    function handleNewPostSuccess(p_response: any) {
        const newPost = p_response.PostEntryResponse as Post;
        newPost.PostEntryReaderState = { LikedByReader: false, RecloutedByReader: false, DiamondLevelBestowed: 0 };
        navigation.navigate('Home', { newPost: newPost })
    }

    function handleCommentSuccess(p_response: any) {
        const newComment = p_response.PostEntryResponse as Post;
        newComment.PostEntryReaderState = { LikedByReader: false, RecloutedByReader: false, DiamondLevelBestowed: 0 };

        const parentPostHashHex = editPost ? editedPost.ParentStakeID : parentPost.PostHashHex;
        navigation.goBack();
        navigation.navigate(
            'AppNavigator',
            {
                screen: 'Post',
                params: {
                    postHashHex: parentPostHashHex,
                    newComment: newComment
                },
                key: 'Post_' + parentPostHashHex
            }
        );
    }

    useEffect(
        () => {

            if (globals.readonly) {
                navigation.goBack();
                Alert.alert('Info', 'You are using CloutFeed in the read-only mode. If you wish to post, please logout and login again using BitClout Identity.');
                return;
            }

            cache.user.getData().then(
                p_user => {
                    const profile = p_user.ProfileEntryResponse;

                    if (editPost) {
                        if (editedPost.RecloutedPostEntryResponse) {
                            setRecloutedPostEntry(editedPost.RecloutedPostEntryResponse);
                        }
                        setPostText(editedPost.Body);
                        if (editedPost.ImageURLs?.length > 0) {
                            setImagesBase64(editedPost.ImageURLs);
                        }
                    } else {
                        setRecloutedPostEntry(recloutedPost);
                    }

                    if (profile) {
                        if (mount) {
                            setProfile(profile);
                            setLoading(false);
                            setCanCreateProfile(true);
                        }
                    } else {
                        if (mount) {
                            setLoading(false);
                            setCanCreateProfile(false);
                        }
                    }
                }
            ).catch(p_error => globals.defaultHandleError(p_error));

            return () => {
                mount = false;
            }
        },
        []
    );

    return (
        <View style={[styles.container, themeStyles.containerColorMain]}>
            {
                isLoading ?
                    <ActivityIndicator style={styles.activityIndicator} color={themeStyles.fontColorMain.color}></ActivityIndicator> :
                    canCreateProfile ?
                        <CreatePostComponent
                            profile={profile}
                            editedPostImageUrls={editedPost?.ImageURLs ? editedPost.ImageURLs : []}
                            postText={postText}
                            setPostText={setPostText}
                            setImagesBase64={setImagesBase64}
                            recloutedPost={recloutedPostEntry}
                            videoLink={editedPost?.PostExtraData.EmbedVideoURL}
                            setVideoLink={setVideoLink}
                        ></CreatePostComponent> :
                        <View style={[
                            globalStyles.profileNotCompletedContainer,
                            { backgroundColor: themeStyles.containerColorSub.backgroundColor }
                        ]}>
                            <Text style={[
                                globalStyles.profileNotCompletedText,
                                { color: themeStyles.fontColorMain.color }
                            ]}
                            >Your profile has not been completed yet. Please visit the official website to update your profile.</Text>
                            <TouchableOpacity
                                style={globalStyles.profileNotCompletedButton}
                                onPress={() => Linking.openURL('https://bitclout.com/')}>
                                <Text style={{ color: 'white' }}>Go to Website</Text>
                            </TouchableOpacity>
                        </View>
            }
        </View>
    );
}

const styles = StyleSheet.create(
    {
        activityIndicator: {
            marginTop: 175
        },
        container: {
            flex: 1
        }
    }
)