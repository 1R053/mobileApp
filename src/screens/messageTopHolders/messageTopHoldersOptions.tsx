import React from 'react';
import { Text, View, StyleSheet } from 'react-native';
import { TouchableOpacity } from 'react-native-gesture-handler';
import { themeStyles } from '../../../styles/globalColors';

export function MessageTopHoldersOptionsScreen({ navigation }: any) {

    const options = [5, 10, 15, 20, 25, 30, 35, 40, 45, 50];

    function onButtonClick(p_count: number) {
        navigation.navigate(
            'MessageTopHoldersInput',
            {
                count: p_count
            }
        );
    }

    return (
        <View style={[styles.container, themeStyles.containerColorSub]}>
            <TouchableOpacity style={[styles.buttonContainer, themeStyles.borderColor, themeStyles.containerColorMain]}
                onPress={() => onButtonClick(-1)}
                activeOpacity={1}>
                <Text style={[styles.buttonText, themeStyles.fontColorMain]}>All Coin Holders</Text>
            </TouchableOpacity>
            {
                options.map(
                    p_count => (
                        <TouchableOpacity
                            style={[styles.buttonContainer, themeStyles.borderColor, themeStyles.containerColorMain]}
                            key={p_count}
                            onPress={() => onButtonClick(p_count)}
                            activeOpacity={1}>
                            <Text style={[styles.buttonText, themeStyles.fontColorMain]}>Top {p_count} Coin Holders</Text>
                        </TouchableOpacity>
                    )
                )
            }
        </View>
    );
}

const styles = StyleSheet.create(
    {
        container: {
            flex: 1
        },
        buttonContainer: {
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            padding: 16,
            borderBottomWidth: 1
        },
        buttonText: {
            marginLeft: 12,
            fontWeight: '600'
        }
    }
);