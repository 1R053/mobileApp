import { createStackNavigator } from '@react-navigation/stack';
import React from 'react';
import { View, Image, StyleSheet, Text, Platform } from 'react-native';
import { TouchableOpacity } from 'react-native-gesture-handler';
import { getFocusedRouteNameFromRoute } from '@react-navigation/core';
import { Ionicons } from '@expo/vector-icons';
import { Feather } from '@expo/vector-icons';
import { TabNavigator } from './tabNavigator';
import { AppearanceScreen } from '@screens/appearance.screen';
import { ChatScreen } from '@screens/chatScreen';
import { CreatePostScreen } from '@screens/createPost.screen';
import { PostScreen } from '@screens/post.screen';
import { ProfileScreen } from '@screens/profile/profile.screen';
import { ProfileFollowersScreen } from '@screens/profileFollowers.screen';
import { SearchScreen } from '@screens/search.screen';
import { SettingsScreen } from '@screens/settings/settings.screen';
import { MessageTopHoldersOptionsScreen } from '@screens/messageTopHolders/messageTopHoldersOptions';
import { MessageTopHoldersInputScreen } from '@screens/messageTopHolders/messageTopHoldersInput';
import { ChatHeaderComponent } from '@components/chatHeader.component';
import { SearchHeaderComponent } from '@components/searchHeader';
import { MessagesHeaderComponent } from '@screens/messages/components/messagesHeader';
import { globals, settingsGlobals, navigatorGlobals } from '@globals';
import { themeStyles } from '@styles';
import { CreatorCoinScreen } from '@screens/creatorCoin/creatorCoin.screen';
import { MessagesScreen } from '@screens/messages/messages.screen';
import EditProfileScreen from '@screens/profile/editProfile.screen';
import { IdentityScreen } from '@screens/login/identity.screen';

const Stack = createStackNavigator();

export function AppNavigator({ navigation }: any) {
    function getHeaderRight(p_route: any) {
        const focusedScreenName = getFocusedRouteNameFromRoute(p_route);
        if (focusedScreenName === 'Profile') {
            return <TouchableOpacity
                style={{ marginRight: 8, paddingRight: 4, paddingLeft: 4 }}
                onPress={() => navigation.navigate('Settings')}
            >
                <Feather name="settings" size={24} color={themeStyles.fontColorMain.color} />
            </TouchableOpacity>;
        } else if (focusedScreenName === undefined || focusedScreenName === 'Home') {
            return <View style={{ flexDirection: 'row' }}>
                <TouchableOpacity
                    style={{ marginRight: 8, paddingRight: 4, paddingLeft: 4 }}
                    onPress={() => navigation.navigate('Search')}
                >
                    <Ionicons name="ios-search" size={26} color={themeStyles.fontColorMain.color} />
                </TouchableOpacity>
                <TouchableOpacity
                    style={{ marginRight: 8, paddingRight: 4, paddingLeft: 4 }}
                    onPress={() => navigation.navigate('Messages')}
                >
                    <Feather name="send" size={26} color={themeStyles.fontColorMain.color} />
                </TouchableOpacity>
            </View>
        }

        return undefined;
    }

    return (
        <Stack.Navigator
            screenOptions={{
                headerTitleStyle: { alignSelf: 'center', color: themeStyles.fontColorMain.color, marginRight: Platform.OS === 'ios' ? 0 : 50 },
                headerStyle: {
                    backgroundColor: themeStyles.containerColorMain.backgroundColor,
                    shadowOpacity: 0,
                    elevation: 0
                },
                headerLeft: () => <TouchableOpacity onPress={() => navigation.goBack()} activeOpacity={1}>
                    <Ionicons name="chevron-back" size={32} color="#007ef5" />
                </TouchableOpacity>
            }}
        >
            <Stack.Screen
                options={
                    ({ route }) => ({
                        headerTitle: ' ',
                        headerLeft: () =>
                            <View style={styles.headerContainer}>
                                {
                                    settingsGlobals.darkMode ?
                                        <Image
                                            style={styles.logo}
                                            source={require('../../assets/icon-black.png')}
                                        ></Image>
                                        :
                                        <Image
                                            style={styles.logo}
                                            source={require('../../assets/icon-white.png')}
                                        ></Image>
                                }
                                <Text style={{ marginLeft: -10, fontWeight: '700', fontSize: 20, color: themeStyles.fontColorMain.color }}>CloutFeed</Text>
                            </View>
                        ,
                        headerRight: () => (
                            <View style={styles.headerContainer}>
                                {
                                    getHeaderRight(route)
                                }
                            </View>
                        ),
                    })
                }
                name="CloutFeed" component={TabNavigator}
            ></Stack.Screen>

            <Stack.Screen
                options={{
                    headerTitle: 'CloutFeed',
                    headerBackTitle: ' '
                }}
                name="UserProfile"
                component={ProfileScreen}
            ></Stack.Screen>

            <Stack.Screen
                options={{
                    headerTitle: 'Edit Profile',
                    headerBackTitle: ' '
                }}
                name="EditProfile"
                component={EditProfileScreen}
            ></Stack.Screen>

            <Stack.Screen
                options={
                    ({ route }) => (
                        {
                            title: route.params ? (route.params as any).username : 'Profile',
                            headerBackTitle: ' '
                        }
                    )
                }
                name="ProfileFollowers"
                component={ProfileFollowersScreen}
            ></Stack.Screen>

            <Stack.Screen
                options={
                    ({ route }) => (
                        {
                            title: route.params ? '$' + (route.params as any).username : 'Creator Coin',
                            headerTitleStyle: { fontSize: 20, alignSelf: 'center', color: themeStyles.fontColorMain.color, marginRight: Platform.OS === 'ios' ? 0 : 50 },
                            headerBackTitle: ' '
                        }
                    )
                }
                name="CreatorCoin"
                component={CreatorCoinScreen}
            ></Stack.Screen>

            <Stack.Screen
                options={{
                    headerTitle: 'CloutFeed',
                    headerBackTitle: ' '
                }}
                name="Post"
                component={PostScreen}
            ></Stack.Screen>

            <Stack.Screen
                options={
                    ({ route }) => (
                        {
                            headerTitle: (route.params as any).newPost ? 'New Post' : (route.params as any).comment ? 'New Comment' :
                                (route.params as any).editPost ? 'Edit Post' : 'Reclout Post',
                            headerBackTitle: 'Cancel',
                            headerRight: () =>
                            (
                                <TouchableOpacity
                                    style={[styles.postButton, themeStyles.buttonBorderColor]}
                                    onPress={() => globals.createPost()}
                                >
                                    <Text style={styles.postButtonText}>Post</Text>
                                </TouchableOpacity>
                            )
                        }
                    )}
                name="CreatePost"
                component={CreatePostScreen}
            ></Stack.Screen>

            <Stack.Screen
                options={({ route }) => (
                    {
                        title: ' ',
                        headerBackTitle: ' ',
                        headerLeft: () => (
                            route.params ?
                                <ChatHeaderComponent contactWithMessages={(route.params as any).contactWithMessages}></ChatHeaderComponent> : undefined
                        )
                    }
                )}
                name="Chat"
                component={ChatScreen}
            ></Stack.Screen>

            <Stack.Screen
                options={{
                    headerTitle: 'Settings',
                    headerBackTitle: ' ',
                }}
                name="Settings"
                component={SettingsScreen}
            ></Stack.Screen>

            <Stack.Screen
                options={{
                    headerTitle: ' ',
                    headerLeft: () => <SearchHeaderComponent></SearchHeaderComponent>,
                    headerBackTitle: ' ',
                }}
                name="Search"
                component={SearchScreen}
            ></Stack.Screen>

            <Stack.Screen
                options={{
                    headerRight: () => <MessagesHeaderComponent></MessagesHeaderComponent>
                }}
                name="Messages"
                component={MessagesScreen}
            ></Stack.Screen>

            <Stack.Screen
                options={{
                    headerTitle: 'Appearance',
                    headerBackTitle: ' ',
                }}
                name="Appearance"
                component={AppearanceScreen}
            ></Stack.Screen>

            <Stack.Screen
                options={{
                    headerTitle: 'Broadcast',
                    headerBackTitle: ' ',
                }}
                name="MessageTopHoldersOptions"
                component={MessageTopHoldersOptionsScreen}
            ></Stack.Screen>

            <Stack.Screen
                options={{
                    headerTitle: 'Broadcast',
                    headerBackTitle: ' ',
                    headerRight: () =>
                    (
                        <TouchableOpacity
                            style={[styles.postButton, themeStyles.buttonBorderColor]}
                            onPress={() => navigatorGlobals.broadcastMessage()}
                        >
                            <Text style={styles.postButtonText}>Send</Text>
                        </TouchableOpacity>
                    )
                }}
                name="MessageTopHoldersInput"
                component={MessageTopHoldersInputScreen}
            ></Stack.Screen>

            <Stack.Screen
                options={
                    {
                        headerStyle: { backgroundColor: '#121212', shadowRadius: 0, shadowOffset: { height: 0, width: 0 } },
                        headerTitleStyle: { color: 'white', fontSize: 20 }
                    }
                }
                name="Identity" component={IdentityScreen} />
        </Stack.Navigator >
    );
}

const styles = StyleSheet.create(
    {
        headerContainer: {
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center'
        },
        postButton: {
            backgroundColor: 'black',
            display: 'flex',
            flexDirection: 'row',
            justifyContent: 'center',
            alignItems: 'center',
            marginRight: 10,
            paddingRight: 12,
            paddingLeft: 12,
            paddingTop: 6,
            paddingBottom: 6,
            borderRadius: 4,
            borderWidth: 1
        },
        postButtonText: {
            color: 'white'
        },
        logo: {
            width: 50,
            height: 40
        }
    }
)