import React, { useEffect, useState } from 'react';
import { ScrollView, TouchableOpacity } from 'react-native-gesture-handler';
import { Text, Image, StyleSheet, View, Dimensions, ActivityIndicator } from 'react-native';
import { globals } from '@globals/globals';
import { api } from '@services/api';
import { themeStyles } from '@styles/globalColors';
import { Profile } from '@types';
import { MaterialIcons } from '@expo/vector-icons';
import { checkProfilePicture } from '@services/helpers';

let lastKeyword;

export function UserSuggestionList({ keyword, onSuggestionPress }: any) {
    const [suggestedMentions, setSuggestedMentions] = useState<Profile[]>([]);
    const [loading, setLoading] = useState<boolean>(false);

    let mount = true;

    useEffect(
        () => {
            if (keyword !== null && keyword !== undefined) {
                getSuggestions()
            }

            () => {
                mount = false;
            }
        },
        [keyword]
    );

    if (keyword == null) {
        return null;
    }

    async function getSuggestions() {
        try {
            let response;
            lastKeyword = keyword;

            if (mount) {
                setLoading(true);
            }

            if (keyword?.length > 0) {
                response = await api.searchProfiles(globals.user.publicKey, keyword, 5);
            } else {
                response = await api.getLeaderBoard(globals.user.publicKey, 5);
            }

            if (lastKeyword !== keyword) {
                return;
            }

            const profiles = response.ProfilesFound as Profile[];

            if (profiles?.length > 0) {
                for (const profile of profiles) {
                    (profile as any).name = profile.Username;
                    checkProfilePicture(profile);
                }
            }

            if (mount) {
                setSuggestedMentions(profiles);
                setLoading(false);
            }
        } catch (error) {
            if (mount) {
                setSuggestedMentions([]);
                setLoading(false);
            }
        }
    }

    return (
        <ScrollView style={[styles.container, themeStyles.borderColor]}>
            {
                loading ?
                    <ActivityIndicator style={styles.activityIndicator} color={themeStyles.fontColorMain.color}></ActivityIndicator>
                    :
                    suggestedMentions.map(
                        p_mention => (
                            <TouchableOpacity
                                key={p_mention.Username}
                                onPress={() => { onSuggestionPress(p_mention); }}
                                style={styles.userMentionCard}>
                                <Image style={styles.profilePic} source={{ uri: p_mention.ProfilePic }} />

                                <View style={styles.usernameContainer}>
                                    <Text style={[styles.username, themeStyles.fontColorMain]}>{p_mention?.Username}</Text>
                                    {
                                        p_mention?.IsVerified ?
                                            <MaterialIcons name="verified" size={16} color="#007ef5" /> : undefined
                                    }
                                </View>
                            </TouchableOpacity>
                        )
                    )
            }
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        borderTopWidth: 1
    },
    activityIndicator: {
        marginTop: 10
    },
    profilePic: {
        width: 40,
        height: 40,
        borderRadius: 8,
        marginRight: 12
    },
    userMentionCard: {
        padding: 12,
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'flex-start',
        alignItems: 'center'
    },
    usernameContainer: {
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center'
    },
    username: {
        fontWeight: '700',
        maxWidth: Dimensions.get('window').width / 2,
        marginRight: 6
    },
})