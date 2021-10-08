import fetch from 'node-fetch';

const gasURL = `https://api.etherscan.io/api?module=gastracker&action=gasoracle&apikey=${process.env.ETHERSCAN_API_KEY}`;

interface GASAPIResult {
    status: string;
    message: string;
    result: {
        LastBlock: string;
        SafeGasPrice: string;
        ProposeGasPrice: string;
        FastGasPrice: string;
        suggestBaseFee: string;
        gasUsedRatio: string;
    }
}

export const fetchGasPrice = async () => {

    const { result } = await (await fetch(gasURL)).json() as GASAPIResult;
    const gasPrice = parseInt(result['ProposeGasPrice']);
    return gasPrice;

};

const lastPriceURL = `https://api.etherscan.io/api?module=stats&action=ethprice&apikey=YourApiKeyToken`

interface LastPriceAPIResult {
    status: string;
    message: string;
    result: {
        ethbtc: string;
        ethbtc_timestamp: string;
        ethusd: string;
        ethusd_timestamp: string;
    }
}

export const fetchLastPrice = async () => {

    const { result } = await (await fetch(lastPriceURL)).json() as LastPriceAPIResult;
    const lastPrice = parseInt(result['ethusd']);
    return lastPrice;

};
