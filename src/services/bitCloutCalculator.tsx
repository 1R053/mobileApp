import { globals } from "../globals/globals";
import { api } from "./api";
import { formatNumber } from "./helpers";

export async function loadTickersAndExchangeRate() {
    await Promise.all(
        [
            api.getTicker(),
            api.getExchangeRate()
        ]
    ).then(
        p_responses => {
            globals.tickers = p_responses[0];
            globals.exchangeRate = p_responses[1];
        }
    ).catch(p_error => globals.defaultHandleError(p_error));
    return true;
}

export function calculateBitCloutInUSD(p_nanos: number) {
    if (globals.tickers.USD && globals.exchangeRate) {
        const usdExchangeRate = globals.tickers.USD.last;
        const satoshiExchangeRate = globals.exchangeRate.SatoshisPerBitCloutExchangeRate;
        const dollarPerSatoshi = usdExchangeRate / 100000000;
        const dollarPerBitClout = satoshiExchangeRate * dollarPerSatoshi;
        const dollarPerNano = dollarPerBitClout / 1000000000;
        let result = dollarPerNano * p_nanos;
        result = Math.round((result + Number.EPSILON) * 100) / 100;
        return result;
    }

    return 0;
}

export function calculateAndFormatBitCloutInUsd(p_nanos: number) {
    return formatNumber(calculateBitCloutInUSD(p_nanos));
}
