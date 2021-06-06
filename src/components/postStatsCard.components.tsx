import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FontAwesome } from '@expo/vector-icons';
import { themeStyles } from '@styles';

export function PostStatsCard({ total, avg, text }: { total: string, avg: string, text: string }) {

    let icon;

    if (text === 'Likes') {
        icon = <Ionicons name={'ios-heart-sharp'} size={40} color={'#eb1b0c'} />
    } else if (text === 'Comments') {
        icon = <FontAwesome name="comment" size={36} color="#3599d4" />
    } else if (text === 'Reclouts') {
        icon = <FontAwesome name="retweet" size={36} color="#5ba358" />
    }

    return <View style={[styles.container, themeStyles.containerColorMain, themeStyles.borderColor]}>
        {icon}
        <Text style={[styles.totalText, themeStyles.fontColorMain]}>{total}</Text>
        <Text style={themeStyles.fontColorSub}>avg. {avg}</Text>
    </View>
}

const styles = StyleSheet.create(
    {
        container: {
            flex: 1,
            marginRight: 10,
            height: 120,
            borderRadius: 8,
            alignItems: 'center',
            justifyContent: 'center',
            borderWidth: 1
        },
        totalText: {
            fontSize: 30,
            fontWeight: '600',
            marginTop: 6
        }
    }
);
