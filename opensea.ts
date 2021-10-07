import type { Browser } from 'puppeteer';
import puppeteer from 'puppeteer-extra';

import StealthPlugin from 'puppeteer-extra-plugin-stealth';
puppeteer.use(StealthPlugin());

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms)); 

export default class OpenSeaClient {

    public _waitForBrowser: Promise<void | null>;
    public browser: Browser|null;

    constructor () {
        this.browser = null;
        this._waitForBrowser = puppeteer.launch({
            headless: true,
        }).then((browser) => {
            console.log('Launched Chromium!');
            this.browser = browser;
        });
        console.log('Launching Chromium...');
    }

    async getSlugStats (slug: string): Promise<{
        floorPrice?: string;
        floorPriceNum?: number;
        itemCount?: string;
        ownerCount?: string;
        volumeTraded?: string;
        slugExists?: boolean;
        iconImageURL?: string;
        bannerImageURL?: string;
        error?: string;
    }> {
        await this._waitForBrowser;
        if (!this.browser) return { error: 'Something when wrong with Chromium.' };

        const page = await this.browser.newPage();
        const waitForFloorPrice = page.waitForSelector('.fqMVjm', {
            timeout: 10000
        });
        await page.goto(`https://opensea.io/collection/${slug}`);
        const waitForFloorPriceSuccess = await waitForFloorPrice.catch(() => {});
        await sleep(500);
        if (!waitForFloorPriceSuccess) {
            page.close();
            return { slugExists: false }
        }

        const parseContent = (content: string): null|{ formatted: string; num: number; } => {
            const updatedContent = content.includes('<') ? content.slice(2, content.length) : content;
            if (isNaN(parseFloat(updatedContent))) return null;
            const parsedContent = updatedContent.includes('K') ? parseFloat(updatedContent) * 1000 : parseFloat(updatedContent);
            return {
                formatted: parsedContent.toLocaleString('en-US', {
                    maximumFractionDigits: 2
                }),
                num: parseFloat(updatedContent)
            };
        }

        //const itemCountElement = (await page.$$('.fqMVjm'))[0];
        //const itemCountContent = await itemCountElement.evaluate((el) => el.textContent) as string;
        //const ownerCount = (await page.$$('.fqMVjm'))[1];
        //const ownerContent = await ownerCount.evaluate((el) => el.textContent) as string;
        const floorPriceElement = (await page.$$('.fqMVjm'))[2];
        const floorPriceContent = await floorPriceElement.evaluate((el) => el.textContent) as string;
        //const volumeTradedElement = (await page.$$('.fqMVjm'))[3];
        //const volumeTradedContent = await volumeTradedElement.evaluate((el) => el.textContent) as string;
        //const bannerImageElement = (await page.$$('.Image--image'))[0];
        //const bannerImageURL = await bannerImageElement.evaluate((el) => el.getAttribute('src')) as string;
        //const iconImageElement = (await page.$$('.Image--image'))[1];
        //const iconImageURL = await iconImageElement.evaluate((el) => el.getAttribute('src')) as string;

        if (
            //!parseContent(itemCountContent)
            //|| !parseContent(ownerContent)
            !parseContent(floorPriceContent)
            //|| !parseContent(volumeTradedContent)
        ) {
            page.close();
            return { error: 'Something went wrong with the floor price of this slug. Please retry with a slug that has a valid floor price' };
        }

        page.close();
        return {
            slugExists: true,
            floorPrice: parseContent(floorPriceContent)?.formatted as string,
            floorPriceNum: parseContent(floorPriceContent)?.num as number,
            //itemCount: parseContent(itemCountContent)?.formatted as string,
            //ownerCount: parseContent(ownerContent)?.formatted as string,
            //volumeTraded: parseContent(volumeTradedContent)?.formatted as string,
            //iconImageURL,
            //bannerImageURL
        }
    }

    formatSlugName (slug: string): string {
        return slug.split('-').map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(' ');
    }

}
