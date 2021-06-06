import { createStackNavigator } from '@react-navigation/stack';
import React from 'react';
import { LoginScreen } from '@screens/login/login.screen';
import { IdentityScreen } from '@screens/login/identity.screen';
import { IdentityInfoScreen } from '@screens/login/identityInfo.screen';
import { Platform, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const Stack = createStackNavigator();

export function LoginNavigator({ navigation }: any) {

    return (
        <Stack.Navigator
            screenOptions={
                {
                    headerStyle: { backgroundColor: '#121212', shadowRadius: 0, shadowOffset: { height: 0, width: 0 } },
                    headerTitleStyle: { alignSelf: 'center', color: 'white', fontSize: 20 }
                }
            }
        >
            <Stack.Screen
                name="Login" component={LoginScreen} />
            <Stack.Screen
                options={
                    {
                        headerTitleStyle: { alignSelf: 'center', color: 'white', fontSize: 20, marginRight: Platform.OS === 'ios' ? 0 : 50 },
                        headerLeft: () => <TouchableOpacity onPress={() => navigation.goBack()} activeOpacity={1}>
                            <Ionicons name="chevron-back" size={32} color="#007ef5" />
                        </TouchableOpacity>
                    }
                }
                name="Identity" component={IdentityScreen} />
            <Stack.Screen
                options={
                    {
                        headerTitleStyle: { alignSelf: 'center', color: 'white', fontSize: 20, marginRight: Platform.OS === 'ios' ? 0 : 50 },
                        headerLeft: () => <TouchableOpacity onPress={() => navigation.goBack()} activeOpacity={1}>
                            <Ionicons name="chevron-back" size={32} color="#007ef5" />
                        </TouchableOpacity>
                    }
                }
                name="IdentityInfo" component={IdentityInfoScreen} />
        </Stack.Navigator >
    );
}