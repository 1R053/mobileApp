import React, { useState } from 'react';
import { Dimensions, StyleSheet, Text, View } from 'react-native';
import { snackbar, SnackbarConfig, isNumber } from '@services';
import { themeStyles } from '@styles';

export function SnackbarComponent() {
    const [showSnackBar, setShowSnackBar] = useState(false);
    const [text, setText] = useState('');
    const [backgroundColor, setBackgroundColor] = useState('');
    const [textColor, setTextColor] = useState('');
    const [borderColor, setBorderColor] = useState('');

    snackbar.showSnackBar = (p_config: SnackbarConfig) => {
        setText(p_config.text);

        let newBackgroundColor = p_config.backgroundColor;
        if (!newBackgroundColor) {
            newBackgroundColor = themeStyles.containerColorSub.backgroundColor;
            setBackgroundColor(newBackgroundColor);
        }

        let newTextColor = p_config.textColor;
        if (!newTextColor) {
            newTextColor = themeStyles.fontColorMain.color;
            setTextColor(newTextColor)
        }

        let newBorderColor = p_config.borderColor;
        if (!newBorderColor) {
            newBorderColor = themeStyles.recloutBorderColor.borderColor;
            setBorderColor(newBorderColor)
        }

        const duration = isNumber(p_config.duration) ? p_config.duration : 2000;

        setBackgroundColor(newBackgroundColor);
        setShowSnackBar(true);
        setTimeout(() => setShowSnackBar(false), duration);
    }

    return showSnackBar ?
        <View style={[styles.container, { backgroundColor: backgroundColor, borderColor: borderColor }]}>
            <Text style={{ color: textColor }}>{text}</Text>
        </View>
        :
        <View></View>
}

const styles = StyleSheet.create({
    container: {
        height: 50,
        width: Dimensions.get('window').width - 40,
        position: 'absolute',
        backgroundColor: 'white',
        bottom: 50,
        left: 20,
        borderRadius: 10,
        paddingLeft: 20,
        paddingRight: 20,
        justifyContent: 'center',
        borderWidth: 1
    }
});
