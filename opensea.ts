import fetch from 'node-fetch';

export const getCollectionStats = (slug: string): Promise<any> => {

    return new Promise((resolve) => {

        fetch(`https://api.opensea.io/collection/${slug}`).then((res) => {

            res.json().then((data) => {

                resolve(data);

            });

        });

    });

}
