import React from "react";
import { View, StyleSheet } from 'react-native';
import { CreatorCoinTransaction } from "@types";
import { VictoryArea, VictoryAxis, VictoryChart, VictoryScatter, VictoryTooltip } from "victory-native";
import { themeStyles } from "@styles/globalColors";
import { formatNumber } from "@services/helpers";
import Svg, { Defs, LinearGradient, Stop } from "react-native-svg"

interface Props {
    publicKey: string;
    currentCoinPrice: number;
    creatorCoinTransactions: CreatorCoinTransaction[];
}

interface State {
    aggregatedDate: { x: number, y: number }[];
}

export class CreatorCoinChartComponent extends React.Component<Props, State> {

    constructor(props: Props) {
        super(props);

        const aggregateData = this.aggregateData();
        const data: { x: number, y: number }[] = [];
        for (let i = 0; i < aggregateData.length; i++) {
            data.push({ x: i, y: aggregateData[i] });
        }

        if (this.props.currentCoinPrice != null) {
            data.push({ x: data.length, y: this.props.currentCoinPrice });
        }

        this.state = {
            aggregatedDate: data
        }
    }

    shouldComponentUpdate(p_nextProps: Props) {
        return p_nextProps.creatorCoinTransactions.length !== this.props.creatorCoinTransactions.length;
    }

    aggregateData() {
        const coinPricePerDayMap: { [key: string]: number[] } = {};

        for (const coinPrice of this.props.creatorCoinTransactions) {
            const timeStampInMilliseconds = coinPrice.timeStamp * 1000;
            const date = new Date(timeStampInMilliseconds);

            const key = '_' + date.getFullYear() + date.getMonth() + date.getDate() + Math.floor(date.getHours() / 8);

            if (coinPricePerDayMap[key]) {
                coinPricePerDayMap[key].push(coinPrice.coinPrice);
            } else {
                coinPricePerDayMap[key] = [coinPrice.coinPrice];
            }
        }

        const keys = Object.keys(coinPricePerDayMap);

        const result = [];

        for (const key of keys) {
            const average = this.getAverage(coinPricePerDayMap[key]);
            result.push(average);
        }

        return result;
    }

    getAverage(p_numbers: number[]) {
        let sum = 0;

        for (const number of p_numbers) {
            sum += number;
        }

        return sum / p_numbers.length;
    }

    render() {
        return <View style={[styles.container, themeStyles.containerColorMain]}>
            <Svg>
                < VictoryChart
                    standalone={false}
                    padding={{ left: 0, top: 10, bottom: 0, right: 32 }}
                    domainPadding={{ x: [0, 5], y: [0, 40] }}
                    theme={
                        {
                            axis: {
                                style: {
                                    tickLabels: {
                                        fill: themeStyles.fontColorSub.color
                                    }
                                }
                            }
                        }
                    }
                >
                    <Defs>
                        <LinearGradient id="gradientStroke"
                            x1="0%"
                            x2="0%"
                            y1="0%"
                            y2="100%"
                        >
                            <Stop offset="0%" stopColor="#1E93FA" stopOpacity="1" />
                            <Stop offset="75%" stopColor="#1E93FA" stopOpacity="0" />
                        </LinearGradient>
                    </Defs>
                    <VictoryAxis
                        style={{
                            grid: { strokeWidth: 0 },
                            axis: { stroke: "transparent" },
                            ticks: { stroke: "transparent" },
                            tickLabels: { fill: "transparent" }
                        }} />
                    <VictoryAxis
                        dependentAxis
                        style={{
                            grid: { strokeWidth: 0 },
                            axis: { stroke: "transparent" },
                            tickLabels: { fontFamily: 'Arial', fontSize: 12 }
                        }}
                        domainPadding={1000}
                        orientation={'right'}
                        tickFormat={p_value => formatNumber(p_value, false)}
                    />
                    <VictoryArea
                        animate={{
                            duration: 2000,
                            onLoad: { duration: 1000 }
                        }}
                        style={{ data: { stroke: '#0061a8', strokeWidth: 1.3, fillOpacity: 0.1, fill: 'url(#gradientStroke)' } }}
                        padding={0}
                        data={this.state.aggregatedDate}
                    />
                    <VictoryScatter
                        size={15}
                        labels={({ datum }) => datum.y.toFixed(2)}
                        labelComponent={
                            <VictoryTooltip
                                dy={-12}
                                flyoutPadding={6}
                                flyoutStyle={{ stroke: 'none', backgroundColor: 'black', fill: themeStyles.containerColorSub.backgroundColor }}
                                renderInPortal={false} />
                        }
                        style={{
                            data: { stroke: 'none', strokeWidth: 2, fillOpacity: 0.1, fill: 'none' },
                            labels: { fill: themeStyles.fontColorMain.color, fontFamily: 'Arial' }
                        }}
                        padding={0}
                        data={this.state.aggregatedDate}
                    />
                </VictoryChart>
            </Svg>
        </View>
    }
}

const styles = StyleSheet.create(
    {
        container: {
            alignItems: 'center',
            justifyContent: 'center',
            height: 300,
            paddingBottom: 10
        }
    }
);