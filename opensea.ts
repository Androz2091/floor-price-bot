import fetch from 'node-fetch';
import { pRateLimit } from 'p-ratelimit';

import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import { Browser } from 'puppeteer-extra-plugin/dist/puppeteer';
puppeteer.use(StealthPlugin())


const limit = pRateLimit({
    interval: 200, 
    rate: 1,
    concurrency: 2,
    maxDelay: 15_000
});

export class OpenSeaClient {
 
    public browser: null|Browser;

    constructor () {
        this.browser = null;
        console.log('Launching Chromium...');
        puppeteer.launch({
            headless: true,
            args: ['--start-maximized']
        }).then((b) => {
            console.log('Launched Chromium!');
            this.browser = b;
        });
    }

    floorPrice(slug: string): Promise<number> {
        return new Promise(async (resolve) => {
            const page = await this.browser!.newPage();
            page.goto(`https://opensea.io/collection/${slug}?search[sortAscending]=true&search[sortBy]=PRICE&search[toggles][0]=BUY_NOW`)
            .then(() => {
                page.waitForTimeout(5)
                    .then(async () => {
                        const floorPrice = await page.evaluate(async () => {
                            const cardsNodeList = document.querySelectorAll(".Asset--anchor .AssetCardFooter--price-amount");
                            const cardsArray = Array.prototype.slice.call(cardsNodeList); // you cannot use .map on a nodeList, we need to transform it to an array
                            const floorPrices = cardsArray.map(card => {
                                try {
                                    // only fetch price in ETH
                                    if (!card.querySelector(".Price--eth-icon")) {
                                        console.log('Icon ether is not here');
                                        return undefined;
                                    }
                                    const priceStr = card.querySelector(".Price--amount").textContent;
                                    console.log('Price str is not here');
                                    return Number(priceStr.split(",").join("."));
                                } catch(err) {
                                    console.log(`The following error will be handled`);
                                    console.error(err);
                                    return undefined;
                                }
                            }).filter(val => val); // filter out invalid (undefined) values
                            // if no ETH price is found, return undefined
                            if (floorPrices.length === 0) {
                                console.log('No ether price found');
                                return undefined;
                            }
                            // sometimes the order of elements is not accurate on Opensea,
                            // thats why we need to minimize get the lowest value
                            // IMPORTANT: spread operator is needed for Math.min() to work with arrays
                            console.log(floorPrices);
                            return Math.min(...floorPrices as number[]);
                        });
                        page.close();
                        resolve(floorPrice || await this.floorPriceAPI(slug));
                    })
            })
            .catch(async (e) => {
                console.log('THE FOLLOWING ERROR WAS HANDLED ✅')
                console.error(e);
                resolve(await this.floorPriceAPI(slug));
            });
        });
    }

    async floorPriceAPI (slug: string): Promise<number> {
        console.log(`Api fetch for ${slug}`);
        return limit(() => fetch(`https://api.opensea.io/collection/${slug}`).then((res) => {
            return res.json().then((data) => {
                return data.collection ? data.collection.stats.floor_price : 0;
            });
        }));
    }
    
}
