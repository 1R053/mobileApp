import { SelectListControl } from "@controls/selectList.control";
import { themeStyles } from "@styles/globalColors";
import React from "react";
import { View, StyleSheet, Text, Dimensions } from "react-native";
import { ScrollView, TouchableOpacity } from "react-native-gesture-handler";

export enum MessageFilter {
    Holders = 'Holders',
    Holding = 'Holding',
    Followers = 'Followers',
    Following = 'Following'
}

export enum MessageSort {
    MostRecent = 'time',
    MostFollowed = 'followers',
    MostClout = 'clout',
    LargestHolder = 'holders',
}

interface Props {
    filter: MessageFilter[];
    sort: MessageSort;
    onSettingsChange: (p_filter: MessageFilter[], p_sort: MessageSort) => void
}

interface State {
    filter: MessageFilter[];
    sort: MessageSort;
}

export class MessageSettingsComponent extends React.Component<Props, State> {

    constructor(props: Props) {
        super(props);

        this.state = {
            filter: this.props.filter.slice(0),
            sort: this.props.sort
        }

        this.onFilterValueChange = this.onFilterValueChange.bind(this);
        this.onSortValueChange = this.onSortValueChange.bind(this);
        this.onDone = this.onDone.bind(this);
    }

    onFilterValueChange(p_value: MessageFilter[]) {
        this.setState({ filter: p_value });
    }

    onSortValueChange(p_value: MessageSort) {
        this.setState({ sort: p_value });
    }

    onDone() {
        this.props.onSettingsChange(this.state.filter, this.state.sort);
    }

    render() {
        return <View style={styles.fullScreen}>
            <View style={styles.overlay}>
            </View>

            <View style={[styles.container, themeStyles.containerColorSub]}>
                <ScrollView bounces={false}>
                    <View style={[styles.headerContainer, themeStyles.recloutBorderColor]}>
                        <Text style={[styles.showText, themeStyles.fontColorMain]}>Filter By</Text>
                    </View>
                    <SelectListControl
                        style={[styles.selectList]}
                        options={[
                            {
                                name: 'Holders',
                                value: MessageFilter.Holders
                            },
                            {
                                name: 'Holding',
                                value: MessageFilter.Holding
                            },
                            {
                                name: 'Followers',
                                value: MessageFilter.Followers
                            },
                            {
                                name: 'Following',
                                value: MessageFilter.Following
                            }
                        ]}
                        value={this.state.filter}
                        onValueChange={this.onFilterValueChange}
                        multiple={true}
                    >
                    </SelectListControl>
                    <View style={[styles.headerContainer, themeStyles.recloutBorderColor]}>
                        <Text style={[styles.showText, themeStyles.fontColorMain]}>Sort By</Text>
                    </View>
                    <SelectListControl
                        style={[styles.selectList]}
                        options={[
                            {
                                name: 'Most Recent',
                                value: MessageSort.MostRecent
                            },
                            {
                                name: 'Largest Holder',
                                value: MessageSort.LargestHolder
                            },
                            {
                                name: 'Most Clout',
                                value: MessageSort.MostClout
                            }, {
                                name: 'Most Followed',
                                value: MessageSort.MostFollowed
                            },
                        ]}
                        value={this.state.sort}
                        onValueChange={this.onSortValueChange}
                    >
                    </SelectListControl>
                </ScrollView>

                <TouchableOpacity style={styles.doneButtonContainer} activeOpacity={0.7} onPress={this.onDone}>
                    <Text style={styles.doneButtonText}>Done</Text>
                </TouchableOpacity>
            </View>
        </View>

    }
}

const styles = StyleSheet.create(
    {
        fullScreen: {
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0
        },
        overlay: {
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'black',
            opacity: 0.6
        },
        container: {
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            padding: 10,
            borderBottomLeftRadius: 16,
            borderBottomRightRadius: 16,
            borderRadius: 16,
            maxHeight: Dimensions.get('window').height * 0.7
        },
        headerContainer: {
            borderBottomWidth: 1,
            width: '100%',
            alignItems: 'center',
            paddingBottom: 5
        },
        showText: {
            fontSize: 16,
            fontWeight: '700'
        },
        selectList: {
            width: '100%'
        },
        doneButtonContainer: {
            display: 'flex',
            alignItems: 'center',
            paddingTop: 12,
            paddingBottom: 12,
            backgroundColor: '#007ef5',
            borderRadius: 8,
            marginTop: 10,
            marginBottom: 6
        },
        doneButtonText: {
            color: 'white',
            fontWeight: '600',
            fontSize: 16
        }
    }
);