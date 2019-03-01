/**
 * Get more fund from https://cennznet-faucet-ui.centrality.me/ if the sender account does not have enough fund
 */
import {stringToU8a} from '@polkadot/util';
import {Api} from 'cennznet-api';
import {SimpleKeyring, Wallet} from 'cennznet-wallet';
import WsProvider from '@polkadot/rpc-provider/ws';
import {SpotX} from '../src/SpotX';

const assetOwner = {
    address: '5FPCjwLUkeg48EDYcW5i4b45HLzmCn4aUbx5rsCsdtPbTsKT',
    seed: stringToU8a(('cennznetjstest' as any).padEnd(32, ' '))
}
const receiver = {
    address: '5EfqejHV2xUUTdmUVBH7PrQL3edtMm1NQVtvCgoYd8RumaP3',
    seed: stringToU8a(('cennznetjstest2' as any).padEnd(32, ' '))
}

const passphrase = 'passphrase';
const url = 'wss://cennznet-node-0.centrality.me:9944';

describe('SpotX APIs', () => {
    let api: Api;
    let spotX: SpotX;
    beforeAll(async () => {
        const websocket = new WsProvider(url);
        api = await Api.create({provider: websocket});
        const simpleKeyring: SimpleKeyring = new SimpleKeyring();
        simpleKeyring.addFromSeed(assetOwner.seed);
        const wallet = new Wallet();
        await wallet.createNewVault(passphrase);
        await wallet.addKeyring(simpleKeyring);
        api.setSigner(wallet);
        spotX = new SpotX(api);
        console.log(spotX);
    }) 

    afterAll(async () => {
        ((api as any)._rpc._provider as any).websocket.onclose = null;
        ((api as any)._rpc._provider as any).websocket.close();
    })

    it('example', () => {
        expect(spotX).toBeDefined();
    })
})
