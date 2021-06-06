import React from 'react';
import { View, StyleSheet, Text, Image, ActionSheetIOS, Alert, TouchableOpacity, Platform, Linking } from 'react-native';
import { Post } from '../types';
import { Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Fontisto } from '@expo/vector-icons';
import WebView from 'react-native-webview';
import { FontAwesome } from '@expo/vector-icons';
import { NavigationProp } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import Clipboard from 'expo-clipboard';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { MaterialIcons } from '@expo/vector-icons';
import { ImageGalleryComponent } from './imageGallery.component';
import { TextWithLinks } from './textWithLinks.component';
import { globals } from '@globals';
import { actionSheet, api, calculateAndFormatBitCloutInUsd, calculateDurationUntilNow, diamondAnimation, snackbar } from '@services';
import { themeStyles } from '@styles';
import { parseVideoLink } from '@services/videoLinkParser';
import { signing } from '@services/authorization/signing';

interface Props {
    navigation: NavigationProp<any>;
    route: any;
    post: Post,
    disablePostNavigate?: boolean,
    disableProfileNavigation?: boolean,
    actionsDisabled?: boolean,
    hideBottomBorder?: boolean,
    recloutedPostIndex?: number
}

interface State {
    likeIcon: any;
    coinPrice: string;
    durationUntilNow: string;
    diamondLevel: number;
    actionsDisabled: boolean;
}

export class PostComponent extends React.Component<Props, State> {

    private _mount = true;

    constructor(p_props: Props) {
        super(p_props);
        const coinPrice = calculateAndFormatBitCloutInUsd(this.props.post.ProfileEntryResponse.CoinPriceBitCloutNanos);
        const durationUntilNow = calculateDurationUntilNow(this.props.post.TimestampNanos);

        this.state = {
            likeIcon: this.getLikeIcon(),
            coinPrice,
            durationUntilNow,
            actionsDisabled: this.props.actionsDisabled || globals.readonly,
            diamondLevel: this.props.post.PostEntryReaderState.DiamondLevelBestowed
        }

        this.onLike = this.onLike.bind(this);
        this.goToProfile = this.goToProfile.bind(this);
        this.onSendDiamonds = this.onSendDiamonds.bind(this);
        this.goToReply = this.goToReply.bind(this);
        this.goToReclout = this.goToReclout.bind(this);
        this.goToPost = this.goToPost.bind(this);
        this.goToRecloutedPost = this.goToRecloutedPost.bind(this);
        this.onPostOptionsClick = this.onPostOptionsClick.bind(this);
        this.getEmbeddedVideoLink = this.getEmbeddedVideoLink.bind(this);
    }

    componentWillUnmount() {
        this._mount = false;
    }

    shouldComponentUpdate(p_nextProps: Props, p_nextState: State) {
        return this.props.post.PostHashHex !== p_nextProps.post.PostHashHex ||
            this.state.likeIcon.name !== p_nextState.likeIcon.name ||
            this.state.diamondLevel !== p_nextState.diamondLevel;
    }

    private getLikeIcon = () => {
        const icon = this.props.post.PostEntryReaderState?.LikedByReader ? { name: 'ios-heart-sharp', color: '#eb1b0c' } : { name: 'ios-heart-outline', color: '#a1a1a1' };
        return icon;
    }

    private async onLike() {
        const post = this.props.post;
        if (this.state.actionsDisabled) {
            return;
        }

        if (!post.PostEntryReaderState) {
            return;
        }

        let originalLikedByReader = post.PostEntryReaderState.LikedByReader;
        post.PostEntryReaderState.LikedByReader = !originalLikedByReader;
        if (post.PostEntryReaderState.LikedByReader) {
            post.LikeCount++
        } else {
            post.LikeCount--;
        }

        if (this._mount) {
            this.setState({ likeIcon: this.getLikeIcon() });
        }

        try {
            const response = await api.likePost(globals.user.publicKey, post.PostHashHex, originalLikedByReader);
            const transactionHex = response.TransactionHex;

            const signedTransactionHex = await signing.signTransaction(transactionHex);
            await api.submitTransaction(signedTransactionHex as string);

        } catch {
            post.PostEntryReaderState.LikedByReader = originalLikedByReader;
            if (post.PostEntryReaderState.LikedByReader) {
                post.LikeCount++
            } else {
                post.LikeCount--;
            }

            if (this._mount) {
                this.setState({ likeIcon: this.getLikeIcon() });
            }
        }
    }

    private async onSendDiamonds() {
        const post = this.props.post;

        if (this.state.actionsDisabled || !post.PostEntryReaderState || post.PostEntryReaderState.DiamondLevelBestowed > 0) {
            return;
        }

        if (globals.user.publicKey === post.ProfileEntryResponse?.PublicKeyBase58Check) {
            Alert.alert('Error', 'You cannot diamond your own posts.');
            return;
        }
        diamondAnimation.show();

        post.PostEntryReaderState.DiamondLevelBestowed = 1;
        post.DiamondCount++;

        this.setState({ diamondLevel: 1 });

        try {
            const response = await api.sendDiamonds(globals.user.publicKey, post.ProfileEntryResponse.PublicKeyBase58Check, post.PostHashHex);
            const transactionHex = response.TransactionHex;

            const signedTransactionHex = await signing.signTransaction(transactionHex);
            await api.submitTransaction(signedTransactionHex as string);

        } catch {
            post.PostEntryReaderState.DiamondLevelBestowed = 0;
            post.DiamondCount--;
            this.setState({ diamondLevel: 0 });
        }
    }

    private goToReply() {
        if (this.state.actionsDisabled) {
            return;
        }

        this.props.navigation.navigate(
            'CreatePost',
            {
                parentPost: this.props.post,
                comment: true
            }
        );
    }

    private goToReclout() {
        if (this.state.actionsDisabled) {
            return;
        }

        this.props.navigation.navigate(
            'CreatePost',
            {
                recloutedPost: this.props.post,
                reclout: true
            }
        );
    }

    private goToProfile() {
        if (!this.props.disableProfileNavigation) {
            (this.props.navigation as any).push(
                'AppNavigator',
                {
                    screen: 'UserProfile',
                    params: {
                        publicKey: this.props.post.ProfileEntryResponse.PublicKeyBase58Check,
                        username: this.props.post.ProfileEntryResponse.Username
                    },
                    key: 'Profile_' + this.props.post.ProfileEntryResponse.PublicKeyBase58Check
                }
            );
        }
    }

    private goToPost() {
        if (this.props.disablePostNavigate !== true) {
            (this.props.navigation as any).push(
                'AppNavigator',
                {
                    screen: 'Post',
                    params: {
                        postHashHex: this.props.post.PostHashHex
                    },
                    key: 'Post_' + this.props.post.PostHashHex
                }
            );
        }
    }

    private goToRecloutedPost() {
        if (this.props.disablePostNavigate !== true) {
            (this.props.navigation as any).push(
                'AppNavigator',
                {
                    screen: 'Post',
                    params: {
                        postHashHex: this.props.post.RecloutedPostEntryResponse.PostHashHex
                    },
                    key: 'Post_' + this.props.post.RecloutedPostEntryResponse.PostHashHex
                }
            );
        }
    }

    private onPostOptionsClick() {
        if (globals.user.publicKey !== this.props.post.ProfileEntryResponse.PublicKeyBase58Check) {
            const options = ['Copy Link', 'Report', 'Block User', 'Cancel'];
            const callBack = async (p_optionIndex: number) => {
                if (p_optionIndex === 0) {
                    this.copyToClipBoard();
                } else if (p_optionIndex === 1) {
                    Linking.openURL(`https://report.bitclout.com/?ReporterPublicKey=${globals.user.publicKey}&PostHash=${this.props.post.PostHashHex}`);
                } else if (p_optionIndex === 2) {
                    const jwt = await signing.signJWT();

                    api.blockUser(globals.user.publicKey, this.props.post.ProfileEntryResponse.PublicKeyBase58Check, jwt as string, false).then(
                        () => this.props.navigation.navigate(
                            'Home',
                            {
                                blockedUser: this.props.post.ProfileEntryResponse.PublicKeyBase58Check
                            }
                        )
                    ).catch(() => Alert.alert('Error', 'Something went wrong! Please try again.'));
                }

            };

            if (Platform.OS === 'ios') {
                ActionSheetIOS.showActionSheetWithOptions(
                    {
                        options: options,
                        destructiveButtonIndex: 2,
                        cancelButtonIndex: 3
                    },
                    callBack
                );
            } else {
                actionSheet.showActionSheet(
                    {
                        options: options,
                        callback: callBack
                    }
                );
            }
        } else {
            const options = ['Copy Link', 'Edit', 'Delete Post', 'Cancel',];
            const callback = (p_optionIndex: number) => {
                if (p_optionIndex === 0) {
                    this.copyToClipBoard();
                } else if (p_optionIndex === 1) {
                    if (this.props.post.Body || this.props.post.ImageURLs?.length > 0) {
                        this.props.navigation.navigate(
                            'CreatePost',
                            {

                                editPost: true,
                                editedPost: this.props.post
                            }
                        );
                    } else {
                        Alert.alert('Sorry!', 'You cannot edit a reclout, if it does not include a quote.');
                    }
                }
                else if (p_optionIndex === 2) {
                    api.hidePost(
                        globals.user.publicKey,
                        this.props.post.PostHashHex,
                        this.props.post.Body,
                        this.props.post.ImageURLs,
                        this.props.post.RecloutedPostEntryResponse?.PostHashHex
                    ).then(
                        async p_response => {
                            const transactionHex = p_response.TransactionHex;

                            const signedTransactionHex = await signing.signTransaction(transactionHex);
                            await api.submitTransaction(signedTransactionHex as string);

                            if (this.props.route.name === 'Home' || this.props.route.name === 'Profile') {
                                Alert.alert('Success', 'Your post was deleted successfully.');
                                this.props.navigation.navigate(
                                    this.props.route.name,
                                    {
                                        deletedPost: this.props.post.PostHashHex
                                    }
                                );

                            } else {
                                Alert.alert('Success', 'Your post was deleted successfully. Please reload the screen to see this change.');
                            }
                        }
                    ).catch(p_error => globals.defaultHandleError(p_error));
                }
            }

            if (Platform.OS === 'ios') {
                ActionSheetIOS.showActionSheetWithOptions(
                    {
                        options: options,
                        destructiveButtonIndex: 2,
                        cancelButtonIndex: 3,
                    },
                    callback
                );
            } else {
                actionSheet.showActionSheet(
                    {
                        options,
                        callback
                    }
                );
            }
        }
    }

    private copyToClipBoard() {
        const postLink = 'https://bitclout.com/posts/' + this.props.post.PostHashHex;
        Clipboard.setString(postLink);
        snackbar.showSnackBar(
            {
                text: 'Link copied to clipboard.'
            }
        );
    }

    public getEmbeddedVideoLink(p_videoLink: string) {
        const youtubeRegExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/;
        const youtubeMatch = p_videoLink.match(youtubeRegExp);
        if (youtubeMatch && youtubeMatch[7].length == 11) {
            const videoId = youtubeMatch[7]
            const videoLink = 'https://www.youtube.com/embed/' + videoId;
            return videoLink;
        }

        return p_videoLink;
    }

    render() {
        const embeddedVideoLink: any = this.props.post.PostExtraData?.EmbedVideoURL ? parseVideoLink(this.props.post.PostExtraData?.EmbedVideoURL) : undefined;
        return (
            <View
                style={[
                    styles.container,
                    { borderBottomWidth: this.props.hideBottomBorder ? 0 : 1 },
                    themeStyles.containerColorMain,
                    themeStyles.borderColor
                ]}>
                <TouchableOpacity onPress={this.goToPost} activeOpacity={1}>
                    <View style={styles.headerContainer}>
                        <TouchableOpacity activeOpacity={1} onPress={this.goToProfile}>
                            <Image style={styles.profilePic} source={{ uri: this.props.post.ProfileEntryResponse?.ProfilePic }}></Image>
                        </TouchableOpacity>
                        <View>
                            <TouchableOpacity style={styles.usernameContainer} activeOpacity={1} onPress={this.goToProfile}>
                                <Text style={[styles.username, themeStyles.fontColorMain]} >{this.props.post.ProfileEntryResponse?.Username}</Text>
                                {
                                    this.props.post.ProfileEntryResponse?.IsVerified ?
                                        <MaterialIcons name="verified" size={16} color="#007ef5" /> : undefined
                                }
                            </TouchableOpacity>

                            <TouchableOpacity style={styles.actionButton} activeOpacity={1}>
                                <Ionicons name="ios-time-outline" size={14} color="#a1a1a1" />
                                <Text style={styles.actionText}>{this.state.durationUntilNow}</Text>
                            </TouchableOpacity>
                        </View>

                        <View style={styles.headerRightContainer}>
                            <View style={[styles.coinPriceContainer, themeStyles.chipColor]}>
                                <Text style={[styles.coinPriceText, themeStyles.fontColorMain]}>
                                    ${this.state.coinPrice}
                                </Text>
                            </View>

                            {
                                !this.state.actionsDisabled ?
                                    <TouchableOpacity activeOpacity={1} onPress={this.onPostOptionsClick}>
                                        <Feather name="more-horizontal" size={20} color="#a1a1a1" />
                                    </TouchableOpacity>
                                    :
                                    undefined
                            }
                        </View>
                    </View>
                </TouchableOpacity>

                <TouchableOpacity onPress={this.goToPost} activeOpacity={1}>
                    <TextWithLinks style={[styles.bodyText, themeStyles.fontColorMain]} text={this.props.post.Body?.trimEnd()}></TextWithLinks>
                </TouchableOpacity>

                {
                    this.props.post.ImageURLs?.length > 0 ?
                        <ImageGalleryComponent imageUrls={this.props.post.ImageURLs} goToPost={this.goToPost}></ImageGalleryComponent> :
                        undefined
                }

                {
                    embeddedVideoLink ?
                        <WebView
                            style={[styles.videoContainer, themeStyles.containerColorMain]}
                            source={{ uri: embeddedVideoLink }}
                            javaScriptEnabled={true}
                            domStorageEnabled={true}
                        ></WebView>
                        :
                        undefined
                }

                {
                    this.props.post.RecloutedPostEntryResponse && (this.props.recloutedPostIndex == null || this.props.recloutedPostIndex < 2) ?
                        <View style={[styles.recloutedPostContainer, themeStyles.recloutBorderColor]}>
                            <TouchableOpacity onPress={this.goToRecloutedPost} activeOpacity={1}>
                                <PostComponent
                                    navigation={this.props.navigation}
                                    route={this.props.route}
                                    post={this.props.post.RecloutedPostEntryResponse}
                                    hideBottomBorder={true}
                                    recloutedPostIndex={this.props.recloutedPostIndex == null ? 1 : this.props.recloutedPostIndex + 1}
                                ></PostComponent>
                            </TouchableOpacity>
                        </View>
                        :
                        undefined
                }
                {
                    this.props.post.Body || this.props.post.ImageURLs?.length > 0 ?
                        <View style={styles.actionsContainer}>
                            <TouchableOpacity style={styles.actionButton} activeOpacity={0.5} onPress={this.onLike.bind(this)}>
                                <Ionicons name={this.state.likeIcon.name as any} size={24} color={this.state.likeIcon.color} />
                                <Text style={styles.actionText}>{this.props.post.LikeCount}</Text>
                            </TouchableOpacity>

                            <TouchableOpacity style={styles.actionButton} activeOpacity={0.5} onPress={this.goToReply}>
                                <Fontisto name='comment' size={19} color={'#a1a1a1'} />
                                <Text style={styles.actionText}>{this.props.post.CommentCount}</Text>
                            </TouchableOpacity>

                            <TouchableOpacity style={styles.actionButton} activeOpacity={0.5} onPress={this.goToReclout}>
                                <MaterialCommunityIcons name="twitter-retweet" size={28} color={this.props.post.PostEntryReaderState?.RecloutedByReader ? '#5ba358' : '#a1a1a1'} />
                                <Text style={styles.actionText}>{this.props.post.RecloutCount}</Text>
                            </TouchableOpacity>

                            <TouchableOpacity style={styles.actionButton} activeOpacity={0.5} onPress={this.onSendDiamonds}>
                                <FontAwesome name="diamond" size={18} color={this.state.diamondLevel != null && this.state.diamondLevel > 0 ? themeStyles.diamondColor.color : '#a1a1a1'} />
                                <Text style={styles.actionText}>{this.props.post.DiamondCount}</Text>
                            </TouchableOpacity>
                        </View>
                        : undefined
                }
            </View >
        );
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        paddingTop: 24,
        paddingBottom: 10,
        width: '100%'
    },
    profilePic: {
        width: 35,
        height: 35,
        borderRadius: 8,
        marginRight: 10
    },
    headerContainer: {
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 10,
        paddingLeft: 10,
        paddingRight: 10
    },
    headerRightContainer: {
        display: 'flex',
        flexDirection: 'row',
        marginLeft: 'auto'
    },
    bodyText: {
        fontSize: 15,
        paddingLeft: 10,
        paddingRight: 10
    },
    usernameContainer: {
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center'
    },
    username: {
        fontWeight: 'bold',
        maxWidth: Dimensions.get('window').width / 2 + 20,
        marginBottom: 2,
        marginRight: 6
    },
    actionsContainer: {
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 14,
        marginLeft: 10
    },
    actionButton: {
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        marginRight: 10,
        flex: 1
    },
    actionText: {
        marginLeft: 4,
        color: '#a1a1a1',
        fontSize: 12
    },
    coinPriceContainer: {
        borderRadius: 12,
        paddingRight: 10,
        paddingLeft: 10,
        marginBottom: 6,
        justifyContent: 'center',
        height: 20,
        marginRight: 12
    },
    coinPriceText: {
        fontSize: 10,
        fontWeight: '600'
    },
    recloutedPostContainer: {
        marginLeft: 10,
        marginRight: 10,
        borderWidth: 1,
        padding: 10,
        paddingBottom: 4,
        borderRadius: 8,
        marginTop: 10
    },
    link: {
        fontWeight: '500'
    },
    videoContainer: {
        opacity: 0.99,
        height: 400,
        width: '100%'
    }
});