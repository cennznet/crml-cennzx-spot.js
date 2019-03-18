/**
 * Get more fund from https://cennznet-faucet-ui.centrality.me/ if the sender account does not have enough fund
 */
import {EventRecord, Null, Tuple, getTypeRegistry, Vector} from '@cennznet/types/polkadot';
import {stringToU8a} from '@cennznet/util';
import {Api} from '@cennznet/api';
import {SimpleKeyring, Wallet} from '@cennznet/wallet';
import {GenericAsset} from '@cennznet/generic-asset';
import {WsProvider} from '@cennznet/api/polkadot';
import BN from 'bn.js';
import {SpotX} from '../src/SpotX';

const assetOwner = {
    address: '5GoKvZWG5ZPYL1WUovuHW3zJBWBP5eT8CbqjdRY4Q6iMaDtZ',
    seed: stringToU8a(('Alice' as any).padEnd(32, ' '))
};

const trader = {
    address: '5Gw3s7q4QLkSWwknsiPtjujPv3XM4Trxi5d4PgKMMk3gfGTE',
    seed: stringToU8a(('Bob' as any).padEnd(32, ' '))
};

const recipient = {
    address: '5FPCjwLUkeg48EDYcW5i4b45HLzmCn4aUbx5rsCsdtPbTsKT',
    seed: stringToU8a(('cennznetjstest' as any).padEnd(32, ' '))
}

const passphrase = 'passphrase';
// const url = 'wss://cennznet-node-0.centrality.me:9944';
const url = undefined;

const coreAssetId = 10;
const tradeAssetId = 0;


describe('SpotX APIs', () => {
    let api: Api;
    let spotX: SpotX;
    let ga: GenericAsset;
    beforeAll(async () => {
        const websocket = new WsProvider(url);
        api = await Api.create({provider: websocket});
        const simpleKeyring: SimpleKeyring = new SimpleKeyring();
        simpleKeyring.addFromSeed(assetOwner.seed);
        simpleKeyring.addFromSeed(trader.seed);
        const wallet = new Wallet();
        await wallet.createNewVault(passphrase);
        await wallet.addKeyring(simpleKeyring);
        api.setSigner(wallet);
        spotX = new SpotX(api);
        ga = new GenericAsset(api);
        //console.log(spotX);
    })

    afterAll(async () => {
        ((api as any)._rpc._provider as any).websocket.onclose = null;
        ((api as any)._rpc._provider as any).websocket.close();
    })
    describe('Add to pool()', () => {
        it('Deposit core asset and trade asset at current ratio to mint exchange tokens and return \'AddLiquidity\' event once successful', async (done) => {

            /**************************************************************/
            /*** Prepare test data to ensure balance *********************/
            /************************************************************/

            const totalAmount: number = 200;
            expect(((await ga.getFreeBalance(tradeAssetId, assetOwner.address)) as BN).gtn(1000)).toBeTruthy();
            expect(((await ga.getFreeBalance(coreAssetId, assetOwner.address)) as BN).gtn(1000)).toBeTruthy();

           await spotX.addLiquidity(tradeAssetId, 2, 200, 200).signAndSend(assetOwner.address, async (status) => {
                if (status.type === 'Finalised' && status.events !== undefined) {
                    let isCreated = false;
                    for(let i = 0; i < status.events.length; i += 1) {
                        const event = status.events[i];
                        if (event.event.method === 'AddLiquidity') {
                            isCreated = true;
                            // TODO: expect(event.event.data[0]).equal(assetId);
                            const balance = await spotX.getLiquidityBalance(tradeAssetId, assetOwner.address);
                            expect(balance.toString(10)).toEqual(totalAmount.toString(10))
                        }
                    }
                    // return isCreated event
                    expect(isCreated).toEqual(true);
                    done();
                }
            });
        })
        it('query', async (done) => {
            const typeRegistry = getTypeRegistry();
            const totalAmount: number = 200;
            const balance = await spotX.getLiquidityBalance(tradeAssetId, assetOwner.address);
            const coreAssetId = await spotX.getCoreAssetId();
            const AssetId = typeRegistry.get('AssetId');
            typeRegistry.register({ExchangeKey: Tuple.with([AssetId, AssetId])});

            const exchangeKey = new Tuple([AssetId, AssetId], [coreAssetId, tradeAssetId]);
            const exchangeAddress = await spotX.getExchangeAddress(tradeAssetId);
            console.log('Exchange address:'+ exchangeAddress);
            const total = await spotX.getTotalLiquidity(tradeAssetId);
            expect(balance.toString(10)).toEqual(totalAmount.toString(10))
            const coreBalance = await ga.getFreeBalance(coreAssetId.toString(), exchangeAddress);
            console.log("Core bal "+ coreBalance);
            const assetBalance = await ga.getFreeBalance(tradeAssetId, exchangeAddress);
            console.log("Trade bal "+ assetBalance);
            const feeRate = await spotX.getFeeRate();
            const expectPay = await spotX.getAssetToCoreOutputPrice(tradeAssetId, 50);
            done();
        })
    })
    it('can transfer ', async (done) => {
        const amountBought = 200;
        const tradeAssetBalanceBefore = await ga.getFreeBalance(tradeAssetId, trader.address) as BN;
        const coreAssetBalanceBefore = await ga.getFreeBalance(coreAssetId, trader.address) as BN;
        console.log(spotX)
        await ga.transfer(tradeAssetId, assetOwner.address, amountBought).signAndSend(trader.address, async (status) => {
            if (status.type === 'Finalised') {
                const tradeAssetBalanceAfter = await ga.getFreeBalance(tradeAssetId, trader.address) as BN;
                const coreAssetBalanceAfter = await ga.getFreeBalance(coreAssetId, trader.address) as BN;
                const gas = coreAssetBalanceBefore.sub(coreAssetBalanceAfter);
                const pay = tradeAssetBalanceBefore.sub(tradeAssetBalanceAfter);
                const blockHash = status.status.asFinalised;
                const events = await api.query.system.events.at(blockHash);
                console.log("Events:"+events);

                done();
            }
        });

    });
    it('can trade from asset to core', async (done) => {
        const amountBought = 50;
        const tradeAssetBalanceBefore = await ga.getFreeBalance(tradeAssetId, trader.address) as BN;
        const coreAssetBalanceBefore = await ga.getFreeBalance(coreAssetId, trader.address) as BN;
        const expectPay = await spotX.getAssetToCoreOutputPrice(tradeAssetId, amountBought);
        console.log(expectPay);
        await spotX.assetToCoreSwapOutput(tradeAssetId, amountBought, 50000).signAndSend(trader.address, async (status) => {
            if (status.type === 'Finalised') {
                const tradeAssetBalanceAfter = await ga.getFreeBalance(tradeAssetId, trader.address) as BN;
                const coreAssetBalanceAfter = await ga.getFreeBalance(coreAssetId, trader.address) as BN;
                const gain = coreAssetBalanceAfter.sub(coreAssetBalanceBefore);
                const pay = tradeAssetBalanceBefore.sub(tradeAssetBalanceAfter);
                const blockHash = status.status.asFinalised;
                const events = await api.query.system.events.at(blockHash) as Vector<EventRecord>;
                const feeChargeEvent = events.find(event => event.event.data.method === 'Charged');
                const gas = feeChargeEvent.event.data[1];
                console.log(expectPay, );
                done();
            }
        });

    });
    it('can trade from core to asset', async (done) => {
        const amountBought = 50;
        const tradeAssetBalanceBefore = await ga.getFreeBalance(tradeAssetId, trader.address) as BN;
        const coreAssetBalanceBefore = await ga.getFreeBalance(coreAssetId, trader.address) as BN;
        await spotX.coreToAssetSwapOutput(tradeAssetId, amountBought, 50000).signAndSend(trader.address, async (status) => {
            if (status.type === 'Finalised') {
                const tradeAssetBalanceAfter = await ga.getFreeBalance(tradeAssetId, trader.address) as BN;
                const coreAssetBalanceAfter = await ga.getFreeBalance(coreAssetId, trader.address) as BN;

                const pay = coreAssetBalanceAfter.sub(coreAssetBalanceBefore);
                const gain = tradeAssetBalanceBefore.sub(tradeAssetBalanceAfter);
                const blockHash = status.status.asFinalised;
                const events = await api.query.system.events.at(blockHash) as Vector<EventRecord>;
                const feeChargeEvent = events.find(event => event.event.data.method === 'Charged');
                const gas = feeChargeEvent.event.data[1];
                // console.log(expectPay, );
                done();
            }
        });

    });
    it('Get trade asset from buyer and transfer core asset to recipient for exact core asset amount', async (done) => {
        const amountBought = 50;
        const tradeAssetBalanceBefore = await ga.getFreeBalance(tradeAssetId, trader.address) as BN;
        const coreAssetBalanceBefore = await ga.getFreeBalance(coreAssetId, recipient.address) as BN;
        await spotX.assetToCoreTransferOutput(recipient.address, tradeAssetId, amountBought, 50000).signAndSend(trader.address, async (status) => {
            if (status.type === 'Finalised') {
                const tradeAssetBalanceAfter = await ga.getFreeBalance(tradeAssetId, trader.address) as BN;
                const coreAssetBalanceAfter = await ga.getFreeBalance(coreAssetId, recipient.address) as BN;
                const gain = coreAssetBalanceAfter.sub(coreAssetBalanceBefore);
                const pay = tradeAssetBalanceBefore.sub(tradeAssetBalanceAfter);
                const blockHash = status.status.asFinalised;
                const events = await api.query.system.events.at(blockHash) as Vector<EventRecord>;
                const feeChargeEvent = events.find(event => event.event.data.method === 'Charged');
                const gas = feeChargeEvent.event.data[1];
                done();
            }
        });

    });

    it('Get core asset from buyer and transfer trade asset to recipient for exact trade asset amount', async (done) => {
        const amountBought = 50;
        const tradeAssetBalanceBefore = await ga.getFreeBalance(tradeAssetId, trader.address) as BN;
        const coreAssetBalanceBefore = await ga.getFreeBalance(coreAssetId, recipient.address) as BN;
        await spotX.coreToAssetTransferOutput(recipient.address, tradeAssetId, amountBought, 50000).signAndSend(trader.address, async (status) => {
            if (status.type === 'Finalised') {
                const tradeAssetBalanceAfter = await ga.getFreeBalance(tradeAssetId, trader.address) as BN;
                const coreAssetBalanceAfter = await ga.getFreeBalance(coreAssetId, recipient.address) as BN;
                const gain = coreAssetBalanceAfter.sub(coreAssetBalanceBefore);
                const pay = tradeAssetBalanceBefore.sub(tradeAssetBalanceAfter);
                const blockHash = status.status.asFinalised;
                const events = await api.query.system.events.at(blockHash) as Vector<EventRecord>;
                const feeChargeEvent = events.find(event => event.event.data.method === 'Charged');
                const gas = feeChargeEvent.event.data[1];
                done();
            }
        });

    });

    describe('Remove from pool()', () => {
        it('Withdraw core asset and trade asset from pool and return \'RemoveLiquidity\' event once successful', async (done) => {
            const totalAmount: number = 200;
            const noBalance: number = 0;
            const balance = await spotX.getLiquidityBalance(tradeAssetId, assetOwner.address);
            await spotX.removeLiquidity(tradeAssetId, balance, 90, 90).signAndSend(assetOwner.address, async (status) => {
                if (status.type === 'Finalised' && status.events !== undefined) {
                    let isRemoved = false;
                    for (let i = 0; i < status.events.length; i += 1) {
                        const event = status.events[i];
                        if (event.event.method === 'RemoveLiquidity') {
                            isRemoved = true;
                            const balance = await spotX.getLiquidityBalance(tradeAssetId, assetOwner.address);
                            expect(balance.toString(10)).toEqual(noBalance.toString(10));
                            expect(((await ga.getFreeBalance(tradeAssetId, assetOwner.address)) as BN).gtn(1000)).toBeTruthy();
                            expect(((await ga.getFreeBalance(coreAssetId, assetOwner.address)) as BN).gtn(1000)).toBeTruthy();
                        }
                    }
                    // return isCreated event
                    expect(isRemoved).toEqual(true);
                    done();
                }
            });

        });
    });


})
