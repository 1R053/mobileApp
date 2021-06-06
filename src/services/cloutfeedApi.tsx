const headers = {
    'content-type': 'application/json',
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_6) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0.1 Safari/605.1.15'
};

const host = 'https://cloutfeedapi.azurewebsites.net/';

function handleResponse(p_response: Response) {
    if (p_response.ok) {
        return p_response.json();
    } else {
        const error = new Error(JSON.stringify(p_response));
        (error as any).status = p_response.status;
        throw error;
    }
}

const get = (p_route: string, p_useHost = true) => {
    return fetch(
        p_useHost ? host + p_route : p_route,
        { headers: headers }
    ).then(p_response => handleResponse(p_response));
};

const post = (p_route: string, p_body: any) => {
    return fetch(
        host + p_route,
        {
            headers: headers,
            method: 'POST',
            body: JSON.stringify(p_body)
        }
    ).then(p_response => handleResponse(p_response));
};

const put = (p_route: string, p_body: any) => {
    return fetch(
        host + p_route,
        {
            headers: headers,
            method: 'PUT',
            body: JSON.stringify(p_body)
        }
    ).then(p_response => handleResponse(p_response));
};

const getHistoricalCoinPrice = (p_publicKey: string, p_timeStamp: number) => {
    const route = `creator-coin/${p_publicKey}/history/${p_timeStamp}`;

    return get(route);
}

const getPinnedPost = () => {
    const route = `promotion/pinned-post`;

    return get(route);
}

const registerNotificationsPushToken = (p_publicKey: string, p_pushToken: string, p_jwt: string) => {
    const route = 'notifications/register/push-token/v2';

    return put(
        route,
        {
            publicKey: p_publicKey,
            pushToken: p_pushToken,
            jwt: p_jwt
        }
    );
}

const unregisterNotificationsPushToken = (p_publicKey: string, p_jwt: string) => {
    const route = 'notifications/unregister/push-token/v2';

    return put(
        route,
        {
            publicKey: p_publicKey,
            pushToken: '',
            jwt: p_jwt
        }
    );
}

const getNotificationSubscriptions = (p_publicKey: string, p_jwt: string, p_subscribedPublicKey: string) => {
    const route = 'notifications/subscriptions';

    return post(
        route,
        {
            publicKey: p_publicKey,
            jwt: p_jwt,
            subscribedPublicKey: p_subscribedPublicKey
        }
    );
}

const subscribeNotifications = (p_publicKey: string, p_jwt: string, p_subscribedPublicKey: string, p_notificationType: string) => {
    const route = 'notifications/subscribe';

    return put(
        route,
        {
            publicKey: p_publicKey,
            jwt: p_jwt,
            subscribedPublicKey: p_subscribedPublicKey,
            notificationType: p_notificationType
        }
    );
}

const unSubscribeNotifications = (p_publicKey: string, p_jwt: string, p_subscribedPublicKey: string, p_notificationType: string) => {
    const route = 'notifications/unsubscribe';

    return put(
        route,
        {
            publicKey: p_publicKey,
            jwt: p_jwt,
            subscribedPublicKey: p_subscribedPublicKey,
            notificationType: p_notificationType
        }
    );
}

export const cloutFeedApi = {
    getHistoricalCoinPrice,
    getPinnedPost,
    registerNotificationsPushToken,
    unregisterNotificationsPushToken,
    getNotificationSubscriptions,
    subscribeNotifications,
    unSubscribeNotifications
};