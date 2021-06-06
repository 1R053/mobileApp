import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { TouchableOpacity } from 'react-native-gesture-handler';
import { themeStyles } from '@styles';

export interface TabConfig {
    name: string;
}

export function TabsComponent({ tabs, selectedTab, onTabClick }: { tabs: TabConfig[], selectedTab: string, onTabClick: (p_tabName: string) => void }) {

    return <View style={[styles.container, themeStyles.containerColorMain]}>
        {
            tabs.map(
                p_tab => <TouchableOpacity
                    key={p_tab.name}
                    style={[
                        styles.tab,
                        selectedTab === p_tab.name ? { borderBottomWidth: 2, borderBottomColor: themeStyles.fontColorMain.color } : {}
                    ]}
                    activeOpacity={1}
                    onPress={() => onTabClick(p_tab.name)}>
                    <Text style={[
                        styles.tabText,
                        selectedTab === p_tab.name ? styles.selectedTabText : {},
                        selectedTab === p_tab.name ? themeStyles.fontColorMain : themeStyles.fontColorSub
                    ]}>{p_tab.name}</Text>
                </TouchableOpacity>
            )
        }
    </View>
}

const styles = StyleSheet.create(
    {
        container: {
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            height: 40
        },
        tab: {
            height: 40,
            paddingLeft: 10,
            paddingRight: 10
        },
        tabText: {
            fontWeight: '500',
            paddingTop: 10,
            fontSize: 15
        },
        selectedTabText: {
            fontWeight: 'bold',
        }
    }
);
