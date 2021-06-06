import React, { Component } from 'react';
import { StyleSheet, View, Modal, Text, TouchableOpacity, Dimensions, Platform } from 'react-native';
import { ImageViewer } from 'react-native-image-zoom-viewer';
import { Feather, Ionicons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system';
import * as MediaLibrary from 'expo-media-library';
import { themeStyles } from '@styles/globalColors';
import * as ImageManipulator from "expo-image-manipulator";

interface Props {
    closeModal: Function;
    modalVisible: boolean;
    imageUrls: Array<any>;
}

interface State {
    snackBarText: string;
}

class ImageModal extends Component<Props, State> {

    private _isMounted = false;
    private _snackBarTimeout: number = -1;
    private _selectedIndex: number = 0;

    constructor(props: any) {
        super(props);

        this.state = {
            snackBarText: ''
        };
    }

    componentDidMount() {
        this._isMounted = true;
    }

    componentWillUnmount() {
        this._isMounted = false;
    }

    saveToLibrary = async () => {
        try {
            let permission = await MediaLibrary.getPermissionsAsync();
            if (!permission.granted) {
                permission = await MediaLibrary.requestPermissionsAsync();

                if (!permission.granted) {
                    this.showSnackBar('Permission for saving the picture is denied!');
                    return;
                }
            }

            const fileUri = FileSystem.cacheDirectory + this.props.imageUrls[this._selectedIndex].replace('https://images.bitclout.com/', '');
            const downloadObject = FileSystem.createDownloadResumable(
                this.props.imageUrls[this._selectedIndex],
                fileUri
            );

            const response: any = await downloadObject.downloadAsync();
            if (response.status === 200) {
                let mediaUri = response.uri;

                if (response.uri.slice(-3) !== 'gif') {
                    const convertedImage = await ImageManipulator.manipulateAsync(
                        response.uri,
                        [],
                        { compress: 1, format: ImageManipulator.SaveFormat.PNG }
                    );
                    mediaUri = convertedImage.uri;
                } 

                FileSystem.getInfoAsync(mediaUri)
                    .then(async (p_result) => {
                        await MediaLibrary.saveToLibraryAsync(p_result.uri);
                        this.showSnackBar("Image saved");
                    })
                    .catch(() => this.showSnackBar("Something went wrong"));
            }
        } catch (error) {
            this.showSnackBar('Something went wrong');
        }
    }

    showSnackBar(p_text: string) {
        if (this._isMounted) {
            window.clearTimeout(this._snackBarTimeout);
            this.setState({ snackBarText: p_text });

            this._snackBarTimeout = window.setTimeout(
                () => {
                    if (this._isMounted) {
                        this.setState({ snackBarText: '' });
                    }
                },
                3000
            );
        }
    }

    render() {
        return (
            <Modal
                animationType="fade"
                transparent={true}
                style={styles.modalView}
                visible={this.props.modalVisible}
                onRequestClose={() => this.props.closeModal()}>
                <View style={styles.container}>
                    <View style={styles.header}>
                        <TouchableOpacity
                            style={styles.closeBtn}
                            onPress={() => { this.props.closeModal(); }}
                            activeOpacity={1}
                        >
                            <Ionicons name="chevron-back" size={32} color="white" />
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.downloadBtn}
                            onPress={() => { this.saveToLibrary(); }}
                        >
                            <Feather name="download" size={28} color="white" />
                        </TouchableOpacity>
                    </View>
                    <ImageViewer
                        renderIndicator={(currentIndex, allSize) => {
                            return allSize && allSize > 1 ?
                                <Text>{currentIndex + "/" + allSize}</Text> :
                                <Text></Text>
                        }}
                        saveToLocalByLongPress={false}
                        style={styles.images}
                        backgroundColor="black"
                        onCancel={() => this.props.closeModal()}
                        swipeDownThreshold={50}
                        enableSwipeDown={true}
                        enablePreload={true}
                        onChange={p_index => this._selectedIndex = p_index as number}
                        maxOverflow={this.props.imageUrls?.length > 1 ? 300 : 0}
                        imageUrls={this.props.imageUrls.map(url => ({ url }))}
                    />
                    <View style={styles.footer}></View>
                    {
                        this.state.snackBarText ?
                            <View style={[styles.snackBar, themeStyles.containerColorSub, themeStyles.recloutBorderColor]}>
                                <Text style={themeStyles.fontColorMain}>{this.state.snackBarText}</Text>
                            </View>
                            :
                            undefined
                    }
                </View>
            </Modal>
        );
    }
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: 'black',
        flex: 1,
    },
    header: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'space-between',
        zIndex: 20,
        marginTop: Platform.OS === 'ios' ? 30 : 0
    },
    modalView: {
        width: '100%',
        height: '100%',
        elevation: 5
    },
    closeBtn: {
        marginTop: '4%',
        marginLeft: '2%'
    },
    downloadBtn: {
        marginTop: '4%',
        marginRight: '4%'
    },
    images: {
        flex: 11
    },
    footer: {
        flex: 1
    },
    snackBar: {
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

export default ImageModal;