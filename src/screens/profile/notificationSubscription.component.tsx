import React, { Component } from 'react';
import { StyleSheet, View, Text, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { themeStyles } from '@styles/globalColors';
import { signing } from '@services/authorization/signing';
import { cloutFeedApi } from '@services/cloutfeedApi';
import { globals } from '@globals/globals';
import Modal from 'react-native-modal';
import { SelectListControl } from '@controls/selectList.control';

enum NotificationType {
    Post = 'Post',
    FounderReward = 'FounderReward'
}

interface Props {
    publicKey: string;
}

interface State {
    isNotificationSubscriptionLoading: boolean;
    notificationModalVisible: boolean;
    subscribedNotifications: NotificationType[];
}

class NotificationSubscriptionComponent extends Component<Props, State> {

    private _isMounted = false;

    constructor(props: any) {
        super(props);

        this.state = {
            isNotificationSubscriptionLoading: true,
            notificationModalVisible: false,
            subscribedNotifications: []
        };

        this.getNotificationSubscriptions = this.getNotificationSubscriptions.bind(this);
        this.closeNotificationModal = this.closeNotificationModal.bind(this);
        this.subscribeNotifications = this.subscribeNotifications.bind(this);
        this.unSubscribeNotifications = this.unSubscribeNotifications.bind(this);
        this.onSubscribedNotificationChange = this.onSubscribedNotificationChange.bind(this);

        this.getNotificationSubscriptions();
    }

    componentDidMount() {
        this._isMounted = true;
    }

    componentWillUnmount() {
        this._isMounted = false;
    }

    async getNotificationSubscriptions() {
        try {
            const jwt = await signing.signJWT();
            const response = await cloutFeedApi.getNotificationSubscriptions(globals.user.publicKey, jwt, this.props.publicKey);
            const subscribedNotifications = [];
            if (response.post === true) {
                subscribedNotifications.push(NotificationType.Post);
            }
            if (response.founderReward === true) {
                subscribedNotifications.push(NotificationType.FounderReward);
            }

            if (this._isMounted) {
                this.setState({
                    subscribedNotifications,
                    isNotificationSubscriptionLoading: false
                });
            }
        } catch (p_error) {
            globals.defaultHandleError(p_error);
        }
    }

    openNotificationModal() {
        if (this._isMounted) {
            this.setState({
                notificationModalVisible: true
            });
        }
    }

    closeNotificationModal() {
        if (this._isMounted) {
            this.setState({ notificationModalVisible: false });
        }
    }

    async subscribeNotifications(p_notificationType: NotificationType) {
        try {
            if (this._isMounted) {
                this.setState({ isNotificationSubscriptionLoading: true });
            }

            const jwt = await signing.signJWT();
            await cloutFeedApi.subscribeNotifications(globals.user.publicKey, jwt, this.props.publicKey, p_notificationType);
            const subscribedNotifications = this.state.subscribedNotifications;
            subscribedNotifications.push(p_notificationType);

            if (this._isMounted) {
                this.setState({
                    subscribedNotifications,
                    isNotificationSubscriptionLoading: false
                });
            }
        } catch (p_error) {
            globals.defaultHandleError(p_error);
        }
    }

    async unSubscribeNotifications(p_notificationType: NotificationType) {
        try {
            if (this._isMounted) {
                this.setState({ isNotificationSubscriptionLoading: true });
            }

            const jwt = await signing.signJWT();
            await cloutFeedApi.unSubscribeNotifications(globals.user.publicKey, jwt, this.props.publicKey, p_notificationType);
            const subscribedNotifications = this.state.subscribedNotifications;
            const index = subscribedNotifications.findIndex((p_value) => p_value === p_notificationType);
            subscribedNotifications.splice(index, 1);

            if (this._isMounted) {
                this.setState({
                    subscribedNotifications,
                    isNotificationSubscriptionLoading: false
                });
            }
        } catch (p_error) {
            globals.defaultHandleError(p_error);
        }
    }

    onSubscribedNotificationChange(p_value: string[]) {
        const shouldSubscribePostNotification = p_value.includes(NotificationType.Post) && !this.state.subscribedNotifications.includes(NotificationType.Post);
        const shouldUnSubscribePostNotification = !p_value.includes(NotificationType.Post) && this.state.subscribedNotifications.includes(NotificationType.Post);
        const shouldSubscribeFRNotification = p_value.includes(NotificationType.FounderReward) && !this.state.subscribedNotifications.includes(NotificationType.FounderReward);
        const shouldUnSubscribeFRNotification = !p_value.includes(NotificationType.FounderReward) && this.state.subscribedNotifications.includes(NotificationType.FounderReward);

        if (shouldSubscribePostNotification) {
            this.subscribeNotifications(NotificationType.Post);
        } else if (shouldUnSubscribePostNotification) {
            this.unSubscribeNotifications(NotificationType.Post);
        } else if (shouldSubscribeFRNotification) {
            this.subscribeNotifications(NotificationType.FounderReward);
        } else if (shouldUnSubscribeFRNotification) {
            this.unSubscribeNotifications(NotificationType.FounderReward);
        }
    }

    render() {
        return (
            <React.Fragment>
                <Ionicons name="md-notifications-outline" size={26} style={[themeStyles.fontColorMain, styles.notificationIcon]} onPress={() => this.openNotificationModal()} />
                {
                    this.state.subscribedNotifications?.length > 0 ?
                    <View style={styles.subscribedCircle}></View>
                    :
                    undefined
                }
                <Modal
                    style={[styles.modalStyle]}
                    animationIn='slideInUp'
                    isVisible={this.state.notificationModalVisible}
                    swipeDirection='down'
                    animationOutTiming={200}
                    onBackButtonPress={() => this.closeNotificationModal()}
                    onSwipeComplete={() => this.closeNotificationModal()}
                    onBackdropPress={() => this.closeNotificationModal()}
                >
                    <View style={[styles.mainContainer, themeStyles.containerColorSub]}>
                        <View style={[styles.headerContainer, themeStyles.borderColor]}>
                            <Text style={[styles.showText, themeStyles.fontColorMain]}>Notifications</Text>
                        </View>
                        {
                            this.state.isNotificationSubscriptionLoading ?
                                <View style={styles.loaderContainer}>
                                    <ActivityIndicator color={themeStyles.fontColorMain.color} />
                                </View> :
                                <View>
                                    <SelectListControl
                                        style={[styles.selectList]}
                                        options={[
                                            {
                                                name: 'Post',
                                                value: NotificationType.Post
                                            },
                                            {
                                                name: 'FR Change',
                                                value: NotificationType.FounderReward
                                            }
                                        ]}
                                        value={this.state.subscribedNotifications}
                                        onValueChange={this.onSubscribedNotificationChange}
                                        multiple={true}
                                    >
                                    </SelectListControl>
                                </View>
                        }
                    </View>
                </Modal>
            </React.Fragment>
        );
    }
}

const styles = StyleSheet.create({
    notificationIcon: {
        left: 2,
        position: 'absolute'
    },
    subscribedCircle: {
        width: 6,
        height: 6,
        borderRadius: 10,
        backgroundColor: '#007ef5',
        position: 'absolute',
        left: 22
    },
    selectList: {
        width: '100%'
    },
    modalStyle: {
        marginTop: 0,
        marginLeft: 0,
        marginBottom: 0,
        width: '100%'
    },
    mainContainer: {
        height: '40%',
        marginTop: 'auto',
        borderTopLeftRadius: 16,
        borderTopRightRadius: 16,
        paddingTop: 25,
    },
    headerContainer: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        width: '100%',
        alignItems: 'center',
        justifyContent: 'center',
        paddingBottom: 5
    },
    showText: {
        fontSize: 20,
        fontWeight: '700'
    },
    closeIcon: {
        position: 'absolute',
        right: 5
    },
    loaderContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center'
    },
    optionContainer: {
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        paddingLeft: 10,
        paddingRight: 10,
        width: '100%',
        height: 50
    },
    optionText: {
        fontSize: 16,
        fontWeight: '400'
    },
    checkIcon: {
        marginLeft: 'auto'
    }
});

export default NotificationSubscriptionComponent;