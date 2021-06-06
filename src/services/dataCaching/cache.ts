import { api } from "../api";
import { CacheableObject } from "./cacheableObject";
import { globals } from "@globals";
import { User } from "@types";

const loggedInUserCacheableObject = new CacheableObject<User>(
    () => api.getProfile([globals.user.publicKey]),
    p_response => p_response.UserList[0] as User,
    600
);

const addFollower = async (p_publicKey: string) => {
    const user = await loggedInUserCacheableObject.getData().catch(() => undefined);

    if (user) {
        if (!user.PublicKeysBase58CheckFollowedByUser) {
            user.PublicKeysBase58CheckFollowedByUser = [p_publicKey];
        } else {
            const publicKeyExists = user.PublicKeysBase58CheckFollowedByUser.indexOf(p_publicKey) !== -1;

            if (!publicKeyExists) {
                user.PublicKeysBase58CheckFollowedByUser.push(p_publicKey);
            }
        }
    }
}

const removeFollower = async (p_publicKey: string) => {
    const user = await loggedInUserCacheableObject.getData().catch(() => undefined);

    if (user) {
        if (user.PublicKeysBase58CheckFollowedByUser) {
            const publicKeyIndex = user.PublicKeysBase58CheckFollowedByUser.indexOf(p_publicKey);

            if (publicKeyIndex !== -1) {
                user.PublicKeysBase58CheckFollowedByUser.splice(publicKeyIndex, 1);
            }
        }
    }
}

export let cache = {
    user: loggedInUserCacheableObject,
    addFollower: addFollower,
    removeFollower: removeFollower
};

export function resetCache() {
    cache.user.reset();
}

export function initCache() {
    cache = {
        user: loggedInUserCacheableObject,
        addFollower: addFollower,
        removeFollower: removeFollower
    };
}