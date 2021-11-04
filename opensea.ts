import fetch from 'node-fetch';
import { HttpsProxyAgent } from 'https-proxy-agent';

export class OpenSeaClient {

    constructor () {
    }

    async floorPrice (slug: string): Promise<number> {
        console.log(`Api fetch for ${slug}`);
        return fetch(`https://api.opensea.io/api/v1/collection/${slug}/stats`, {
            agent: new HttpsProxyAgent(process.env.PROXY_URL!)
        }).then((res) => {
            return res.json().then((data) => {
		        console.log(`Floor price is ${data.stats.floor_price}`)
                return data.stats ? data.stats.floor_price : 0;
            });
        });
    }
    
}
