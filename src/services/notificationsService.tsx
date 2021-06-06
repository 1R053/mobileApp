import * as Notifications from 'expo-notifications';
import { eventManager, globals } from '@globals';
import { Platform } from 'react-native';
import { cloutFeedApi } from './cloutfeedApi';
import { signing } from './authorization/signing';
import { EventType } from '@types';

let lastIdentifier = '';
let notificationHandler: any;

async function registerPushToken() {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
    }
    if (finalStatus === 'granted') {
        Notifications.setNotificationHandler(
            {
                handleNotification: async () => (
                    {
                        shouldShowAlert: true,
                        shouldPlaySound: false,
                        shouldSetBadge: false
                    }
                ),
            }
        );

        const token = (await Notifications.getExpoPushTokenAsync()).data;
        const jwt = await signing.signJWT();
        await cloutFeedApi.registerNotificationsPushToken(globals.user.publicKey, token, jwt as string);
    }

    if (Platform.OS === 'android') {
        Notifications.setNotificationChannelAsync('default', {
            name: 'default',
            importance: Notifications.AndroidImportance.MAX,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: '#FF231F7C',
        });
    }
}

async function registerNotificationHandler() {
    if (notificationHandler) {
        return;
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    if (existingStatus !== 'granted') {
        return;
    }

    notificationHandler = Notifications.addNotificationResponseReceivedListener(
        p_response => {
            const identifier = p_response?.notification?.request?.identifier;

            if (identifier === lastIdentifier) {
                return;
            }

            lastIdentifier = identifier;
            const trigger: any = p_response.notification?.request?.trigger;

            let body;
            if (trigger?.payload?.body) {
                body = trigger.payload.body;
            } else if (trigger?.remoteMessage?.data?.body) {
                body = trigger.remoteMessage.data.body
            }

            if (body) {
                if (typeof body === 'object') {
                    eventManager.dispatchEvent(
                        EventType.Navigation,
                        body
                    );
                } else {
                    try {
                        body = JSON.parse(body);
                        eventManager.dispatchEvent(
                            EventType.Navigation,
                            body
                        );
                    } catch {

                    }
                }
            }
        }
    );
}


function unregisterNotificationHandler() {
    if (notificationHandler) {
        Notifications.removeNotificationSubscription(notificationHandler);
        notificationHandler = undefined;
    }
}

export const notificationsService = {
    registerPushToken,
    registerNotificationHandler,
    unregisterNotificationHandler
};