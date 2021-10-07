import fetch from 'node-fetch';
import { JSDOM } from 'jsdom';

const url = `https://www.larvalabs.com/cryptopunks/forsale`;

export const fetchFloorPrice = async () => {

    const content = await (await fetch(url)).text();
    const dom = new JSDOM(content);
    const document = dom.window.document;
    const price = (document.querySelector('.punk-image-text-dense')! as HTMLDivElement).innerHTML.trim().split('<br>')[0];

    return price;

};
