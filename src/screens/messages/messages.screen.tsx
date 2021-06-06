import React from "react";
import { eventManager } from "@globals/injector";
import { themeStyles } from "@styles/globalColors";
import { View, StyleSheet, FlatList, RefreshControl, ActivityIndicator, Text } from "react-native";
import { ContactWithMessages, EventType } from "@types";
import { MessageFilter, MessageSettingsComponent, MessageSort } from "./components/messageSettings";
import * as SecureStore from 'expo-secure-store';
import { constants } from "@globals/constants";
import { globals } from "@globals/globals";
import { api } from "@services/api";
import { getAnonymousProfile } from "@services";
import { ContactMessagesListCardComponent } from "@screens/messages/components/contactMessagesListCard.component";

interface Props { }

interface State {
    isLoading: boolean;
    openSettings: boolean;
    messagesFilter: MessageFilter[];
    messagesSort: MessageSort;
    contacts: ContactWithMessages[];
    refreshing: boolean;
    isLoadingMore: boolean;
    noMoreMessages: boolean;
}

export class MessagesScreen extends React.Component<Props, State>{

    private _isMounted = false;
    private _subscriptions: (() => void)[] = [];

    constructor(props: Props) {
        super(props);

        this.state = {
            isLoading: true,
            openSettings: false,
            messagesFilter: [],
            messagesSort: MessageSort.MostRecent,
            contacts: [],
            refreshing: false,
            isLoadingMore: false,
            noMoreMessages: false
        };

        this.getMessageSettings().then(
            ({ messagesFilter, messagesSort }) => {
                this.loadMessages(messagesFilter, messagesSort);

                if (this._isMounted) {
                    this.setState({ messagesFilter, messagesSort });
                }
            }
        );

        this._subscriptions.push(
            eventManager.addEventListener(EventType.OpenMessagesSettings, this.openMessagesSettings.bind(this))
        );

        this.loadMessages = this.loadMessages.bind(this);
        this.loadMoreMessages = this.loadMoreMessages.bind(this);
        this.onMessageSettingChange = this.onMessageSettingChange.bind(this);
    }

    componentDidMount() {
        this._isMounted = true;
    }

    componentWillUnmount() {
        for (const unsubscribe of this._subscriptions) {
            unsubscribe();
        }

        this._isMounted = false;
    }

    shouldComponentUpdate(_nextProps: Props, p_nextState: State) {
        return p_nextState.openSettings !== this.state.openSettings ||
            p_nextState.isLoading !== this.state.isLoading ||
            p_nextState.isLoadingMore !== this.state.isLoadingMore;
    }

    loadMessages(p_messageFilter: MessageFilter[], p_messageSort: MessageSort) {
        if (this._isMounted && !this.state.isLoading) {
            this.setState({ isLoading: true });
        }

        this.getMessagesCallback(p_messageFilter, p_messageSort, '').then(
            p_response => {
                const contacts = this.processData(p_response);

                if (this._isMounted) {
                    this.setState({ contacts, isLoading: false, noMoreMessages: contacts.length < 25 });
                }
            }
        );
    }

    loadMoreMessages(p_messageFilter: MessageFilter[], p_messageSort: MessageSort) {
        if (this.state.isLoadingMore || !this.state.contacts || this.state.contacts.length === 0 || this.state.noMoreMessages) {
            return;
        }

        if (this._isMounted) {
            this.setState({ isLoadingMore: true });
        }

        const lastPublicKey = this.state.contacts[this.state.contacts.length - 1].PublicKeyBase58Check;

        this.getMessagesCallback(p_messageFilter, p_messageSort, lastPublicKey).then(
            p_response => {
                const contacts = this.processData(p_response);

                if (this._isMounted) {
                    this.setState({ contacts: this.state.contacts.concat(contacts), isLoadingMore: false, noMoreMessages: contacts.length < 25 });
                }
            }
        );
    }

    getMessagesCallback(p_messageFilter: MessageFilter[], p_messageSort: MessageSort, p_lastPublicKey: string) {
        p_messageFilter = p_messageFilter ? p_messageFilter : [];

        return api.getMessages(
            globals.user.publicKey,
            p_messageFilter.indexOf(MessageFilter.Followers) !== -1,
            p_messageFilter.indexOf(MessageFilter.Following) !== -1,
            p_messageFilter.indexOf(MessageFilter.Holders) !== -1,
            p_messageFilter.indexOf(MessageFilter.Holding) !== -1,
            25,
            p_messageSort,
            p_lastPublicKey
        );
    }

    processData(p_response: any): ContactWithMessages[] {
        const unreadStateByContact = p_response?.UnreadStateByContact ? p_response.UnreadStateByContact : {};
        const contactsWithMessages: ContactWithMessages[] = p_response?.OrderedContactsWithMessages ? p_response.OrderedContactsWithMessages : [];

        for (const contactWithMessages of contactsWithMessages) {
            if (!contactWithMessages.ProfileEntryResponse) {
                contactWithMessages.ProfileEntryResponse = getAnonymousProfile(contactWithMessages.PublicKeyBase58Check);
            }

            contactWithMessages.UnreadMessages = unreadStateByContact[contactWithMessages.PublicKeyBase58Check];
        }

        return contactsWithMessages;
    }

    async getMessageSettings(): Promise<{ messagesFilter: MessageFilter[], messagesSort: MessageSort }> {
        let messagesFilter: MessageFilter[] = [];
        let messagesSort: MessageSort = MessageSort.MostRecent;

        const messageFilterKey = globals.user.publicKey + constants.localStorage_messagesFilter;
        const messageFilterString = await SecureStore.getItemAsync(messageFilterKey);

        if (messageFilterString) {
            try {
                const messagesFilterValue = JSON.parse(messageFilterString);
                if (messagesFilterValue.constructor === Array) {
                    messagesFilter = messagesFilterValue;
                }
            } catch { }
        }

        const messageSortKey = globals.user.publicKey + constants.localStorage_messagesSort;
        const messageSortValue = await SecureStore.getItemAsync(messageSortKey);

        if (messageSortValue && this.validSort(messageSortValue)) {
            messagesSort = messageSortValue as MessageSort;
        }

        return { messagesFilter, messagesSort };
    }

    openMessagesSettings() {
        if (this._isMounted) {
            this.setState({ openSettings: true });
        }
    }

    async onMessageSettingChange(p_filter: MessageFilter[], p_sort: MessageSort) {

        try {
            const messageFilterKey = globals.user.publicKey + constants.localStorage_messagesFilter;
            await SecureStore.setItemAsync(messageFilterKey, JSON.stringify(p_filter));

            const messageSortKey = globals.user.publicKey + constants.localStorage_messagesSort;
            await SecureStore.setItemAsync(messageSortKey, p_sort);

            if (this._isMounted) {
                this.setState({ messagesFilter: p_filter, messagesSort: p_sort, openSettings: false });
                this.loadMessages(p_filter, p_sort);
            }
        }
        catch {

        }
    }

    validSort(p_value: any): boolean {
        return p_value === MessageSort.MostRecent ||
            p_value === MessageSort.MostFollowed ||
            p_value === MessageSort.MostClout ||
            p_value === MessageSort.LargestHolder;
    }

    render() {
        return <View style={[styles.container, themeStyles.containerColorMain]}>
            {
                this.state.isLoading ?
                    <View style={[styles.listContainer, themeStyles.containerColorMain]}>
                        <ActivityIndicator style={styles.activityIndicator} color={themeStyles.fontColorMain.color}></ActivityIndicator>
                    </View>
                    :
                    globals.readonly ?
                        <View style={[{ alignItems: 'center', justifyContent: 'center' }, styles.listContainer, themeStyles.containerColorSub]}>
                            <Text style={[themeStyles.fontColorMain]}>Messages are not available in the read-only mode.</Text>
                        </View>
                        :
                        <View style={[styles.listContainer, themeStyles.containerColorMain]}>
                            <FlatList
                                data={this.state.contacts}
                                keyExtractor={(item, index) => item.PublicKeyBase58Check + index.toString()}
                                renderItem={({ item }) => <ContactMessagesListCardComponent contactWithMessages={item}></ContactMessagesListCardComponent>}
                                refreshControl={<RefreshControl
                                    tintColor={themeStyles.fontColorMain.color}
                                    titleColor={themeStyles.fontColorMain.color}
                                    refreshing={this.state.refreshing}
                                    onRefresh={() => this.loadMessages(this.state.messagesFilter, this.state.messagesSort)}

                                />}
                                onEndReached={() => this.loadMoreMessages(this.state.messagesFilter, this.state.messagesSort)}
                                ListFooterComponent={() => this.state.isLoadingMore ? <ActivityIndicator color={themeStyles.fontColorMain.color}></ActivityIndicator> : <View></View>}
                            />
                        </View>
            }

            {
                this.state.openSettings ?
                    <MessageSettingsComponent
                        filter={this.state.messagesFilter}
                        sort={this.state.messagesSort}
                        onSettingsChange={this.onMessageSettingChange}
                    ></MessageSettingsComponent>
                    : undefined
            }
        </View>
    }
}

const styles = StyleSheet.create(
    {
        container: {
            flex: 1,
            width: '100%'
        },
        activityIndicator: {
            marginTop: 175
        },
        listContainer: {
            flex: 1,
            width: '100%'
        }
    }
);