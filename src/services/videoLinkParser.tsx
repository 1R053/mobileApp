import { api } from "./api";

export async function parseVideoLinkAsync(p_videoLink: string) {
    if (!p_videoLink) {
        return undefined;
    }

    let videoLink = parseVideoLink(p_videoLink);

    if (videoLink) {
        return videoLink;
    }

    const tiktokRegExp2 = /^.*(vm\.tiktok\.com\/)([A-Za-z0-9]{6,12}).*/
    const tiktokMatch2 = p_videoLink.match(tiktokRegExp2);

    if (tiktokMatch2 && tiktokMatch2.length > 2) {
        const videoId = tiktokMatch2[2]
        try {
            const response = await api.getTikTokFullVideoId(videoId);
            const fullUrl = response.FullTikTokURL;
            const fullVideoId = extractTikTokVideoId(fullUrl);
            const videoLink = 'https://www.tiktok.com/embed/v2/' + fullVideoId;
            return videoLink;
        } catch {
        }
    }

    return undefined;
}

export function parseVideoLink(p_videoLink: string) {

    if (!p_videoLink) {
        return undefined;
    }

    const youtubeRegExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/;
    const youtubeMatch = p_videoLink.match(youtubeRegExp);
    if (youtubeMatch && youtubeMatch[7].length == 11) {
        const videoId = youtubeMatch[7]
        const videoLink = 'https://www.youtube.com/embed/' + videoId;
        return videoLink;
    }

    const vimeoRegExp = /^.*(player\.)?(vimeo\.com\/)(video\/)?((channels\/[A-z]+\/)|(groups\/[A-z]+\/videos\/))?([0-9]+)/
    const vimeoMatch = p_videoLink.match(vimeoRegExp);

    if (vimeoMatch && vimeoMatch.length > 7) {
        const videoId = vimeoMatch[7]
        const videoLink = 'https://player.vimeo.com/video/' + videoId;
        return videoLink;
    }

    const tikTokVideoId = extractTikTokVideoId(p_videoLink);
    if (tikTokVideoId != null) {
        const videoLink = 'https://www.tiktok.com/embed/v2/' + tikTokVideoId;
        return videoLink;
    }

    return undefined;
}

function extractTikTokVideoId(p_url: string) {
    const tiktokRegExp = /^.*((tiktok\.com\/)(v\/)|(@[A-Za-z0-9_-]{2,24}\/video\/)|(embed\/v2\/))(\d{0,30}).*/
    const tiktokMatch = p_url.match(tiktokRegExp);

    if (tiktokMatch && tiktokMatch.length > 6) {
        const videoId = tiktokMatch[6];
        return videoId;
    }

    return undefined;
}