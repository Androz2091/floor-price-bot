import fetch from 'node-fetch';

const url = `https://api.etherscan.io/api?module=gastracker&action=gasoracle&apikey=${process.env.ETHERSCAN_API_KEY}`;

interface APIResult {
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

export const fetchPrice = async () => {

    const { result } = await (await fetch(url)).json() as APIResult;
    const gasPrice = parseInt(result['ProposeGasPrice']);
    return gasPrice;

};
