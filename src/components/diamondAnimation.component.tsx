import React, { useState } from 'react';
import { Dimensions, StyleSheet, View, Animated } from 'react-native';
import { diamondAnimation } from '@services';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { themeStyles } from '@styles/globalColors';

interface Diamond {
    x: number;
    y?: number;
    angle: string;
    animation: any;
    color: string;
}

export function DiamondAnimationComponent() {
    const [showDiamondAnimation, setShowDiamondAnimation] = useState<boolean>(false);
    const [diamonds, setDiamonds] = useState<Diamond[]>([]);

    diamondAnimation.show = () => {
        const { width: screenWidth, height: screenHeight } = Dimensions.get('screen')

        const newDiamonds = [...new Array(125)].map((_, i) => {
            return {
                x: screenWidth * Math.random(),
                y: screenHeight * Math.random(),
                angle: Math.PI * 2 * Math.random() + 'rad',
                animation: new Animated.Value(0),
                color: themeStyles.diamondColor.color
            }
        });

        setDiamonds(newDiamonds);
        setShowDiamondAnimation(true);

        setTimeout(
            () => {
                for (const diamond of newDiamonds) {
                    Animated.timing(
                        diamond.animation,
                        {
                            toValue: screenHeight,
                            duration: 2000,
                            useNativeDriver: true
                        }
                    ).start()
                }
            },
            0
        );
        setTimeout(
            () => {
                setDiamonds([]);
                setShowDiamondAnimation(false);
            },
            2000
        );
    }

    return showDiamondAnimation ?
        <View style={styles.container}>
            {
                diamonds.map(
                    (p_diamond, p_index) =>
                        <Animated.View
                            style={{
                                position: 'absolute',
                                top: p_diamond.y,
                                left: p_diamond.x,
                                height: 30, width: 30,
                                transform: [{ translateY: p_diamond.animation }]
                            }}
                            key={p_index}
                        >

                            <MaterialCommunityIcons
                                style={[
                                    { transform: [{ rotate: p_diamond.angle }] }
                                ]}
                                name="diamond-stone" size={24} color={p_diamond.color} />
                        </Animated.View>
                )
            }
        </View>
        : <View></View>
}

const styles = StyleSheet.create(
    {
        container: {
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0
        },
        diamond: {
            position: 'absolute',
            top: 0,
            left: 0
        }
    }
);