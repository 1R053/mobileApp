import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, Image, FlatList, Dimensions } from 'react-native';
import { ScrollView, TouchableOpacity } from 'react-native-gesture-handler';
import { FontAwesome } from '@expo/vector-icons';
import { Fontisto } from '@expo/vector-icons';
import ImageModal from './imageModal.component';

export function ImageGalleryComponent({ imageUrls, goToPost, removable, onRemove, selectedImageIndex }: any) {
    let mount = true;
    const scrollRef = useRef(null);
    const [internalIndex, setInternalIndex] = useState(0);
    const [imageWidth, setImageWidth] = useState(0);
    const [modalVisible, setModalVisible] = useState(false);

    function onChangeImage({ nativeEvent }: any) {
        const slide = Math.round(nativeEvent.contentOffset.x / nativeEvent.layoutMeasurement.width);
        if (slide !== internalIndex && slide >= 0 && slide < imageUrls.length) {
            if (mount) {
                setInternalIndex(slide);
            }
        }
    }

    useEffect(
        () => {
            return () => {
                mount = false;
            }
        },
        []
    );

    useEffect(
        () => {
            selectedImageIndex = selectedImageIndex != null ? selectedImageIndex : 0;
            setInternalIndex(selectedImageIndex);
            if (scrollRef.current) {
                (scrollRef.current as any).scrollTo({ x: Dimensions.get('window').width * selectedImageIndex });
            }
        },
        [selectedImageIndex]
    );
    return (
        <View style={styles.container}>
            <ScrollView
                onLayout={p_event => setImageWidth(p_event.nativeEvent.layout.width)}
                ref={scrollRef}
                pagingEnabled
                horizontal
                scrollEventThrottle={8}
                showsHorizontalScrollIndicator={false}
                onScroll={onChangeImage}
                scrollEnabled={imageUrls?.length > 1}
                style={styles.imagesContainer}
                bounces={false}
            >
                {
                    imageUrls?.map(
                        (p_imageUrl: string, index: number) =>
                            p_imageUrl ?
                                <TouchableOpacity
                                    style={styles.image}
                                    onPress={() => setModalVisible(true)}
                                    activeOpacity={1}
                                    key={index}>
                                    <Image style={[styles.image, { width: imageWidth }]} source={{ uri: p_imageUrl }} key={index}></Image>
                                </TouchableOpacity>
                                :
                                undefined
                    )
                }
            </ScrollView>
            {
                imageUrls?.length > 1 ?
                    <FlatList
                        style={styles.dotsContainer}
                        data={imageUrls}
                        keyExtractor={(item, index) => index.toString()}
                        horizontal
                        renderItem={({ item, index }) => (
                            <FontAwesome
                                style={[styles.dot, internalIndex === index ? styles.selectedDot : styles.notSelectedDot]}
                                name="circle"
                                size={8}
                                color="black" />
                        )}
                    /> : undefined
            }

            {
                removable && onRemove ?
                    <View style={styles.removeButtonContainer}>
                        <TouchableOpacity style={styles.removeButton} onPress={() => onRemove(internalIndex)}>
                            <Fontisto name="close-a" size={14} color="white" />
                        </TouchableOpacity>
                    </View> : undefined
            }

            {
                modalVisible ?
                    <ImageModal imageUrls={imageUrls} modalVisible={modalVisible} closeModal={() => setModalVisible(!modalVisible)} />
                    :
                    undefined
            }
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        marginTop: 14
    },
    imagesContainer: {
        height: 400,
        width: '100%'
    },
    image: {
        height: 400,
        resizeMode: 'contain'
    },
    dotsContainer: {
        alignSelf: 'center',
        marginTop: 2
    },
    dot: {
        marginRight: 4
    },
    selectedDot: {
        color: '#363636'
    },
    notSelectedDot: {
        color: '#d1d1d1'
    },
    removeButtonContainer: {
        backgroundColor: '#c42326',
        width: 30,
        height: 30,
        zIndex: 10,
        position: 'absolute',
        top: 10,
        right: 10,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 8,
        opacity: 0.8
    },
    removeButton: {
        width: 30,
        height: 30,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
    }
});