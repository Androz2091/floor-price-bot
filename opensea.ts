import fetch from 'node-fetch';
import { HttpsProxyAgent } from 'https-proxy-agent';

export class OpenSeaClient {

    public attemptsBeforeSuccess: Map<string, number>;

    constructor () {
        this.attemptsBeforeSuccess = new Map();
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
        }).catch((e) => {
            console.log(e);
            if (this.attemptsBeforeSuccess.has(slug)) {
                if (this.attemptsBeforeSuccess.get(slug)! > 5) {
                    console.log(`Failed to fetch ${slug} after 5 attempts`);
                    return 0;
                }
                this.attemptsBeforeSuccess.set(slug, this.attemptsBeforeSuccess.get(slug)! + 1);
            } else {
                this.attemptsBeforeSuccess.set(slug, 1);
            }
            return this.floorPrice(slug);
        });
    }
    
}
