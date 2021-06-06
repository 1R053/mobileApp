import { NavigationProp } from "@react-navigation/core";

export enum EventType {
    IncreaseFollowers = 0,
    DecreaseFollowers = 1,
    OpenMessagesSettings = 2,
    ToggleProfileManager = 3,
    Navigation = 4
}

export interface ChangeFollowersEvent {
    publicKey: string;
}

export interface ToggleProfileManagerEvent {
    visible: boolean;
    navigation: NavigationProp<any>;
}

export interface NavigationEvent {
    loggedInUsername: string;
    screen: 'Post' | 'UserProfile';
    publicKey?: string;
    username?: string;
    postHashHex?: string;
    priorityCommentHashHex?: string;
}