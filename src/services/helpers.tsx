import { Profile } from "@types";

export function calculateDurationUntilNow(p_timeStampNanoSeconds: number): string {
    const milliseconds = p_timeStampNanoSeconds / 1000000;
    const durationUntilNowInMilliseconds = new Date().getTime() - milliseconds;
    const durationInMinutes = durationUntilNowInMilliseconds / 1000 / 60;

    if (durationInMinutes < 60) {
        return Math.floor(durationInMinutes) + 'm';
    }

    const durationInHours = durationInMinutes / 60;

    if (durationInHours < 24) {
        return Math.floor(durationInHours) + 'h';
    }

    const durationInDays = durationInHours / 24;

    return Math.floor(durationInDays) + 'd';
}

export function getAnonymousProfile(p_publicKey: string) {
    const profile = {
        Username: 'anonymous',
        PublicKeyBase58Check: p_publicKey,
        Description: '',
        ProfilePic: 'https://i.imgur.com/vZ2mB1W.png',
        CoinPriceBitCloutNanos: 0,
    } as Profile;

    return profile;
}

export function checkProfilePicture(p_profile: Profile) {
    if (p_profile.ProfilePic === '/assets/img/default_profile_pic.png') {
        p_profile.ProfilePic = 'https://i.imgur.com/vZ2mB1W.png'
    }
}

var SYMBOLs = ["", "k", "M", "G", "T", "P", "E"];

export function formatNumber(p_number: number, p_includeDecimalPlaces = true, p_decimalPlaces = 2) {

    var tier = Math.log10(Math.abs(p_number)) / 3 | 0;

    if (tier <= 0) {
        return p_includeDecimalPlaces ? p_number.toFixed(p_decimalPlaces) : p_number.toString();
    };

    var suffix = SYMBOLs[tier];
    var scale = Math.pow(10, tier * 3);

    var scaled = p_number / scale;

    return scaled.toFixed(1) + suffix;
}

export function isNumber(p_value: any) {
    return !isNaN(p_value) &&
        !isNaN(parseFloat(p_value));
}