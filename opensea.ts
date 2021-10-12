import fetch from 'node-fetch';
import { pRateLimit } from 'p-ratelimit';

const limit = pRateLimit({
    interval: 200, 
    rate: 1,
    concurrency: 1, 
    maxDelay: 2000
});

export const getCollectionStats = (slug: string): Promise<any> => {

    return new Promise(async (resolve) => {

        await limit(() => fetch(`https://api.opensea.io/collection/${slug}`).then((res) => {

            res.json().then((data) => {

                resolve(data);

            });
        }));

    });

}
