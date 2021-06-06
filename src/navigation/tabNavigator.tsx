import React, { useEffect, useState } from 'react';
import { Image, Platform, StyleSheet, View } from 'react-native';
import { TouchableOpacity } from 'react-native-gesture-handler';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Ionicons } from '@expo/vector-icons';
import { ProfileScreen } from '@screens/profile/profile.screen';
import { NotificationsScreen } from '@screens/notifications.screen';
import { HomeScreen } from '@screens/home.screen';
import { eventManager, globals, navigatorGlobals, settingsGlobals } from '@globals';
import { themeStyles } from '@styles';
import { WalletScreen } from '@screens/wallet/wallet.screen';
import { cache } from '@services/dataCaching';
import { EventType, NavigationEvent } from '@types';
import { notificationsService } from '@services/notificationsService';

const Tab = createBottomTabNavigator();

const TabElement = ({ tab, onPress, selectedTab, navigation }: any) => {
    const [profilePic, setProfilePic] = useState('https://i.imgur.com/vZ2mB1W.png');

    let iconColor = themeStyles.fontColorMain.color;
    let icon;
    let mount = true;

    if (selectedTab === tab.name) {
        iconColor = '#4287f5';
    }

    if (tab.name === 'Home') {
        icon = <MaterialCommunityIcons name="lightning-bolt-outline" size={28} color={iconColor} />;
    } else if (tab.name === 'Wallet') {
        icon = <Ionicons name="wallet-outline" size={28} color={iconColor} />;
    } else if (tab.name === 'Notifications') {
        icon = <Ionicons name="md-notifications-outline" size={28} color={iconColor} />;
    } else if (tab.name === 'Profile') {
        icon = <Image style={{ width: 30, height: 30, borderRadius: 30, borderWidth: selectedTab === tab.name ? 2 : 0, borderColor: iconColor }} source={{ uri: profilePic }}></Image>
    }

    useEffect(
        () => {
            if (tab.name === 'Profile') {
                cache.user.getData().then(
                    (user) => {
                        if (mount && user.ProfileEntryResponse) {
                            setProfilePic(user.ProfileEntryResponse.ProfilePic);
                        }
                    }
                );
            }

            return () => {
                mount = false;
            };
        },
        []
    )

    return (
        <TouchableOpacity
            style={{ padding: 6 }}
            onPress={onPress}
            onLongPress={tab.name === 'Profile' && !globals.readonly ? () => { eventManager.dispatchEvent(EventType.ToggleProfileManager, { visible: true, navigation: navigation }) } : undefined}
        >
            {icon}
        </TouchableOpacity>
    );
};

const TabBar = ({ state, navigation }: any) => {
    const [selectedTab, setSelectedTab] = useState('Home');
    const { routes } = state;

    function navigate(p_screenName: string, p_params?: any) {
        if (selectedTab === p_screenName) {
            if (selectedTab === 'Home') {
                navigatorGlobals.refreshHome();
            }
        }

        navigation.navigate(p_screenName, p_params);
        setSelectedTab(p_screenName);

        if (p_screenName === 'Notifications') {
            navigatorGlobals.refreshNotifications();
        } else if (p_screenName === 'Wallet') {
            navigatorGlobals.refreshWallet();
        } else if (p_screenName === 'Profile') {
            navigatorGlobals.refreshProfile();
        }
    }

    return (
        <View style={[styles.tabsContainer, themeStyles.containerColorMain, { borderColor: settingsGlobals.darkMode ? '#141414' : '#f2f2f2' }]}>
            {
                routes.slice(0, 2).map((p_route: any) => (
                    <TabElement
                        tab={p_route}
                        onPress={() => navigate(p_route.name)}
                        selectedTab={selectedTab}
                        key={p_route.key}>
                    </TabElement>
                ))
            }
            <View>
                <TouchableOpacity onPress={() => navigate('CreatePost', { newPost: true })}>
                    <Ionicons name="add-circle-sharp" size={50} color={themeStyles.fontColorMain.color} />
                </TouchableOpacity>
            </View>
            {
                routes.slice(2).map((p_route: any) => (
                    <TabElement
                        tab={p_route}
                        onPress={() => navigate(p_route.name)}
                        selectedTab={selectedTab}
                        key={p_route.key}
                        navigation={navigation}>
                    </TabElement>
                ))
            }
        </View>
    );
}

export function TabNavigator({ navigation }: any) {

    useEffect(
        () => {
            const unsubscribe = eventManager.addEventListener(
                EventType.Navigation,
                (p_event: NavigationEvent) => {
                    let params;
                    let key;

                    switch (p_event.screen) {
                        case 'UserProfile':
                            params = {
                                publicKey: p_event.publicKey,
                                username: p_event.username
                            };
                            key = 'Profile_' + p_event.publicKey;
                            break;
                        case 'Post':
                            params = {
                                postHashHex: p_event.postHashHex,
                                priorityComment: p_event.priorityCommentHashHex
                            };
                            key = 'Post_' + p_event.postHashHex;
                            break;
                    }

                    if (params && key) {
                        (navigation as any).push(
                            p_event.screen,
                            params
                        );
                    }
                }
            );

            notificationsService.registerNotificationHandler();
            return () => {
                unsubscribe();
                notificationsService.unregisterNotificationHandler();
            };
        },
        []
    );

    return (
        <Tab.Navigator
            tabBar={props => <TabBar {...props}></TabBar>}>
            <Tab.Screen name="Home" component={HomeScreen} />
            <Tab.Screen name="Wallet" component={WalletScreen} />
            <Tab.Screen name="Notifications" component={NotificationsScreen} />
            <Tab.Screen name="Profile" component={ProfileScreen} />
        </Tab.Navigator>
    );
}


const styles = StyleSheet.create(
    {
        tabsContainer: {
            height: Platform.OS === 'ios' ? 80 : 60,
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-around',
            paddingRight: 16,
            paddingLeft: 16,
            paddingBottom: Platform.OS === 'ios' ? 20 : 0,
            borderTopWidth: 1
        }
    }
);