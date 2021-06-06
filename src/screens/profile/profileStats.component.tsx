import React, { useEffect, useState } from 'react';
import { ActivityIndicator, View, StyleSheet, Text, Dimensions } from 'react-native';
import { VictoryPie } from 'victory-native';
import { PostStatsCard } from '@components/postStatsCard.components';
import { calculateBitCloutInUSD, formatNumber, isNumber } from '@services';
import { CreatorCoinHODLer, Post, Profile } from '@types';
import { themeStyles } from '@styles';

interface Stats {
    likesCount: number;
    avgLikesCount: number;
    commentsCount: number;
    avgCommentsCount: number;
    recloutsCount: number;
    avgRecloutsCount: number;
    avgCoinPricePerFollower: number;
    avgCoinPricePerHODLer: number;
    numFollowers: number;
    numHODLers: number;
    coinPrice: number;
    cloutRate: number;
}

export function ProfileStats(
    { profile, followers, reload }:
        { profile: Profile, followers: Profile[], reload: any }
) {
    const [isLoading, setLoading] = useState(true);

    const [likesCount, setLikesCount] = useState<string>('');
    const [avgLikesCount, setAvgLikesCount] = useState<string>('');
    const [commentsCount, setCommentsCount] = useState<string>('');
    const [avgCommentsCount, setAvgCommentsCount] = useState<string>('');
    const [recloutsCount, setRecloutsCount] = useState<string>('');
    const [avgRecloutsCount, setAvgRecloutsCount] = useState<string>('');
    const [avgCoinPricePerFollower, setAvgCoinPricePerFollower] = useState<string>('');
    const [avgCoinPricePerHODLer, setAvgCoinPricePerHODLer] = useState<string>('');
    const [cloutRate, setCloutRate] = useState<number>(0);

    let mount = true;

    useEffect(
        () => {
            loadProfiles();
            return () => {
                mount = false;
            }
        }, []
    );

    function loadProfiles() {
        if (mount) {
            setLoading(true);
        }

        let postsData = profile.Posts;

        if (!postsData) {
            postsData = [];
        }

        if (mount) {
            const stats: Stats = {} as Stats;
            stats.coinPrice = calculateBitCloutInUSD(profile.CoinPriceBitCloutNanos);
            calculatePostsStats(postsData, stats);
            calculateAvgCoinPricePerFollower(stats);
            calculateAvgCoinPricePerHODLer(stats);
            calculateCloutRate(stats);
            formatData(stats);
            setLoading(false);
        }
    }

    reload.stats = loadProfiles;

    function calculatePostsStats(p_posts: Post[], p_stats: Stats) {
        let likesCount = 0;
        let avgLikesCount = 0;
        let commentsCount = 0;
        let avgCommentsCount = 0;
        let recloutsCount = 0;
        let avgRecloutsCount = 0;

        if (p_posts?.length > 0) {
            for (let i = 0; i < p_posts.length; i++) {
                const post = p_posts[i];

                if (!post) {
                    continue;
                }

                if (isNumber(post.LikeCount)) {
                    likesCount += post.LikeCount
                }

                if (isNumber(post.CommentCount)) {
                    commentsCount += post.CommentCount
                }

                if (isNumber(post.RecloutCount)) {
                    recloutsCount += post.RecloutCount
                }
            }

            avgLikesCount = Math.round(likesCount / p_posts.length);
            avgCommentsCount = Math.round(commentsCount / p_posts.length);
            avgRecloutsCount = Math.round(recloutsCount / p_posts.length);
        }

        p_stats.likesCount = likesCount;
        p_stats.avgLikesCount = avgLikesCount;
        p_stats.commentsCount = commentsCount;
        p_stats.avgCommentsCount = avgCommentsCount;
        p_stats.recloutsCount = recloutsCount;
        p_stats.avgRecloutsCount = avgRecloutsCount;
    }

    function calculateAvgCoinPricePerFollower(p_stats: Stats) {
        p_stats.avgCoinPricePerFollower = 0;
        p_stats.numFollowers = 0;

        if (followers?.length > 0) {
            let followersCoinPriceSum = 0;

            for (let i = 0; i < followers.length; i++) {
                const follower = followers[i];
                if (follower && isNumber(follower.CoinPriceBitCloutNanos)) {
                    const followerCoinPriceInUSD = calculateBitCloutInUSD(follower.CoinPriceBitCloutNanos);
                    followersCoinPriceSum += followerCoinPriceInUSD
                }
            }

            const avgCoinPricePerFollower = followersCoinPriceSum / followers.length;
            p_stats.avgCoinPricePerFollower = avgCoinPricePerFollower;
            p_stats.numFollowers = followers.length;
        }
    }

    function calculateAvgCoinPricePerHODLer(p_stats: Stats) {
        p_stats.avgCoinPricePerHODLer = 0;
        p_stats.numHODLers = 0;

        const usersWhoHODL = profile.UsersThatHODL;
        if (usersWhoHODL && usersWhoHODL.length > 0) {
            let hodlersCoinPriceSum = 0;

            for (let i = 0; i < usersWhoHODL.length; i++) {
                const hodler = usersWhoHODL[i];
                if (hodler?.ProfileEntryResponse && isNumber(hodler.ProfileEntryResponse.CoinPriceBitCloutNanos)) {
                    const hodlerCoinPriceInUSD = calculateBitCloutInUSD(hodler.ProfileEntryResponse.CoinPriceBitCloutNanos);
                    hodlersCoinPriceSum += hodlerCoinPriceInUSD
                }
            }

            const avgCoinPricePerHodler = hodlersCoinPriceSum / usersWhoHODL.length;
            p_stats.avgCoinPricePerHODLer = avgCoinPricePerHodler;
            p_stats.numHODLers = usersWhoHODL.length;
        }

    }

    function calculateCloutRate(p_stats: Stats) {
        const algo: { value: number, max: number, step: number }[] = [
            {
                value: p_stats.likesCount,
                max: 10,
                step: 50
            },
            {
                value: p_stats.avgLikesCount,
                max: 5,
                step: 3
            },
            {
                value: p_stats.commentsCount,
                max: 10,
                step: 25
            },
            {
                value: p_stats.avgCommentsCount,
                max: 5,
                step: 2
            },
            {
                value: p_stats.recloutsCount,
                max: 5,
                step: 3
            },
            {
                value: p_stats.numFollowers,
                max: 10,
                step: 100
            },
            {
                value: p_stats.numHODLers,
                max: 10,
                step: 5
            },
            {
                value: p_stats.avgCoinPricePerHODLer,
                max: 20,
                step: 20
            },
            {
                value: p_stats.coinPrice,
                max: 20,
                step: 50
            }
        ];

        let maxScore = 0;
        let cr = 0;

        for (let i = 0; i < algo.length; i++) {
            const score = getScore(algo[i].value, algo[i].max, algo[i].step);
            cr += score;
            maxScore += algo[i].max;
        }
        cr = cr / maxScore;
        cr = Math.round(cr * 100);
        p_stats.cloutRate = cr;
    }

    function getScore(p_value: number, p_max: number, p_step: number) {
        return Math.min(Math.round(p_value / p_step), p_max)
    }

    function formatData(p_stats: Stats) {
        if (mount) {
            setLikesCount(formatNumber(p_stats.likesCount, false));
            setAvgLikesCount(formatNumber(p_stats.avgLikesCount, false));
            setCommentsCount(formatNumber(p_stats.commentsCount, false));
            setAvgCommentsCount(formatNumber(p_stats.avgCommentsCount, false));
            setRecloutsCount(formatNumber(p_stats.recloutsCount, false));
            setAvgRecloutsCount(formatNumber(p_stats.avgRecloutsCount, false));
            setAvgCoinPricePerFollower(formatNumber(p_stats.avgCoinPricePerFollower, true));
            setAvgCoinPricePerHODLer(formatNumber(p_stats.avgCoinPricePerHODLer, true));
            setCloutRate(p_stats.cloutRate);
        }
    }

    return isLoading ?
        <ActivityIndicator style={styles.activityIndicator} color={themeStyles.fontColorMain.color}></ActivityIndicator>
        :
        <View style={styles.container}>
            <View style={[styles.sectionHeaderContainer]}>
                <Text style={[styles.sectionHeaderText, themeStyles.fontColorSub]}>Clout Rate</Text>
            </View>

            <View style={[styles.cloutRateContainer, themeStyles.containerColorMain, themeStyles.borderColor]}>
                <VictoryPie
                    height={200}
                    innerRadius={85}
                    colorScale={['#5ba358', '#e0e0e0']}
                    data={[
                        { x: ' ', y: cloutRate },
                        { x: ' ', y: 100 - cloutRate }
                    ]}
                />

                <Text style={[styles.cloutRate, themeStyles.fontColorMain]}>{cloutRate}%</Text>
            </View>

            <View style={[styles.sectionHeaderContainer, styles.sectionMargin]}>
                <Text style={[styles.sectionHeaderText, themeStyles.fontColorSub]}>Social</Text>
            </View>
            <View style={styles.flexRow}>
                <PostStatsCard total={likesCount} avg={avgLikesCount} text='Likes'></PostStatsCard>
                <PostStatsCard total={commentsCount} avg={avgCommentsCount} text='Comments'></PostStatsCard>
                <PostStatsCard total={recloutsCount} avg={avgRecloutsCount} text='Reclouts'></PostStatsCard>
            </View>
            <View style={[styles.sectionHeaderContainer, styles.sectionMargin]}>
                <Text style={[styles.sectionHeaderText, themeStyles.fontColorSub]}>Creator Coin</Text>
            </View>

            <View>
                {/* <View style={[styles.creatorCoinStatsCard, themeStyles.containerColorMain, themeStyles.borderColor]}>
                    <Text style={[styles.creatorCoinStatsCardTitle, themeStyles.fontColorMain]}>Avg. Coin Price per Follower</Text>
                    <Text style={[styles.creatorCoinStatsCardValue, themeStyles.fontColorMain]}>~${avgCoinPricePerFollower}</Text>
                </View> */}
                <View style={[styles.creatorCoinStatsCard, themeStyles.containerColorMain, themeStyles.borderColor]}>
                    <Text style={[styles.creatorCoinStatsCardTitle, themeStyles.fontColorMain]}>Avg. Coin Price per HODLer</Text>
                    <Text style={[styles.creatorCoinStatsCardValue, themeStyles.fontColorMain]}>~${avgCoinPricePerHODLer}</Text>
                </View>
            </View>
        </View>
}

const styles = StyleSheet.create(
    {
        activityIndicator: {
            marginTop: 175
        },
        container: {
            paddingBottom: 25
        },
        flexRow: {
            display: 'flex',
            flexDirection: 'row',
            justifyContent: 'space-evenly',
            marginLeft: 10
        },
        sectionHeaderContainer: {
            alignItems: 'center',
            marginBottom: 10,
            marginTop: 10
        },
        sectionMargin: {
            marginTop: 20
        },
        sectionHeaderText: {
            fontSize: 16,
            fontWeight: '600'
        },
        cloutRateContainer: {
            alignItems: 'center',
            justifyContent: 'center',
            marginLeft: 10,
            marginRight: 10,
            borderWidth: 1,
            height: 190,
            borderRadius: 8
        },
        cloutRate: {
            position: 'absolute',
            fontSize: 36,
            fontWeight: '600'
        },
        creatorCoinStatsCard: {
            display: 'flex',
            flexDirection: 'row',
            justifyContent: 'space-between',
            paddingTop: 10,
            paddingBottom: 10,
            paddingLeft: 10,
            paddingRight: 10,
            borderBottomWidth: 1
        },
        creatorCoinStatsCardTitle: {
            maxWidth: Dimensions.get('window').width * 0.7
        },
        creatorCoinStatsCardValue: {
            fontWeight: '600',
            fontSize: 16
        }
    }
);
