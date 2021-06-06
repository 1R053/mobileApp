import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { TouchableOpacity } from 'react-native-gesture-handler';
import { actionSheet, ActionSheetConfig } from '@services';
import { themeStyles } from '@styles';

export function ActionSheet() {
    const [showActionSheet, setShowActionSheet] = useState(false);
    const [options, setOptions] = useState<string[]>([]);
    const [config, setConfig] = useState<ActionSheetConfig>();

    actionSheet.showActionSheet = (p_config: ActionSheetConfig) => {
        setOptions(p_config.options);
        setConfig(p_config);

        setShowActionSheet(true);
    }

    function onOptionClick(p_optionIndex: number) {
        config?.callback(p_optionIndex);
        setShowActionSheet(false);
    }

    return showActionSheet ?
        <View style={styles.container}>
            <View style={styles.overlay}></View>
            <View style={[styles.optionsContainer, themeStyles.containerColorMain]}>
                {
                    options.map(
                        (p_option, p_index) =>
                            <TouchableOpacity
                                style={[styles.optionButton, themeStyles.recloutBorderColor]}
                                key={p_index.toString()}
                                onPress={() => onOptionClick(p_index)}
                            >
                                <Text style={[themeStyles.fontColorMain]}>{p_option}</Text>
                            </TouchableOpacity>
                    )
                }
            </View>
        </View>
        :
        <View></View>
}

const styles = StyleSheet.create(
    {
        container: {
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            top: 0,
        },
        overlay: {
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            top: 0,
            backgroundColor: 'black',
            opacity: 0.5
        },
        optionsContainer: {
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0
        },
        optionButton: {
            height: 50,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderTopWidth: 1
        }
    }
);
