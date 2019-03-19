/**
 * Get more fund from https://cennznet-faucet-ui.centrality.me/ if the sender account does not have enough fund
 */
import {EventRecord, getTypeRegistry, Vector} from '@cennznet/types/polkadot';
import {stringToU8a} from '@cennznet/util';
import {Api} from '@cennznet/api';
import {SimpleKeyring, Wallet} from '@cennznet/wallet';
import {GenericAsset} from '@cennznet/generic-asset';
import {WsProvider} from '@cennznet/api/polkadot';
import BN from 'bn.js';
import {SpotX} from '../src/SpotX';

const investor = {
    address: '5H6dGC3TbdyKFagoCEXGaNtsovTtpYYtMTXnsbtVYcn2T1VY',
    seed: stringToU8a(('cennznet-js-test' as any).padEnd(32, ' ')),
};

const trader = investor;

const recipient = {
    address: '5FPCjwLUkeg48EDYcW5i4b45HLzmCn4aUbx5rsCsdtPbTsKT',
    seed: stringToU8a(('cennznetjstest' as any).padEnd(32, ' ')),
};

const passphrase = '';
const url = 'wss://cennznet-node-0.centrality.me:9944';
// const url = undefined;

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
        simpleKeyring.addFromSeed(investor.seed);
        const wallet = new Wallet();
        await wallet.createNewVault(passphrase);
        await wallet.addKeyring(simpleKeyring);
        api.setSigner(wallet);
        spotX = await SpotX.create(api);
        ga = spotX.ga;
    });

    afterAll(async () => {
        ((api as any)._rpc._provider as any).websocket.onclose = null;
        ((api as any)._rpc._provider as any).websocket.close();
    });
    describe('Liquidity Operations', () => {
        it("Add liquidity and receive 'AddLiquidity' event", async done => {
            /**************************************************************/
            /*** Prepare test data to ensure balance *********************/
            /************************************************************/

            const investAmount: number = 200;
            const maxAssetAmount = '100000000000000';
            expect((await ga.getFreeBalance(tradeAssetId, investor.address)).gtn(1000)).toBeTruthy();
            expect((await ga.getFreeBalance(coreAssetId, investor.address)).gtn(1000)).toBeTruthy();

            await spotX
                .addLiquidity(tradeAssetId, 0, maxAssetAmount, investAmount)
                .signAndSend(investor.address, async status => {
                    if (status.type === 'Finalised' && status.events !== undefined) {
                        let isCreated = false;
                        for (let i = 0; i < status.events.length; i += 1) {
                            const event = status.events[i];
                            if (event.event.method === 'AddLiquidity') {
                                isCreated = true;
                                const [account, coreInvestAmount, assetId, targetInvestAmount] = event.event.data;
                                expect(account.toString()).toEqual(investor.address);
                                expect(((assetId as unknown) as BN).toNumber()).toEqual(tradeAssetId);
                                expect(((coreInvestAmount as unknown) as BN).toNumber()).toEqual(investAmount);
                                expect(
                                    ((targetInvestAmount as unknown) as BN).lte(new BN(maxAssetAmount))
                                ).toBeTruthy();
                                const liquidity = await spotX.getLiquidityBalance(tradeAssetId, investor.address);
                                expect(liquidity.gtn(0)).toBeTruthy();
                            }
                        }
                        // return isCreated event
                        expect(isCreated).toEqual(true);
                        done();
                    }
                });
        });

        it("Remove liquidity and receive 'RemoveLiquidity' event", async done => {
            const liquidity = await spotX.getLiquidityBalance(tradeAssetId, investor.address);
            await spotX.removeLiquidity(tradeAssetId, liquidity, 1, 1).signAndSend(investor.address, async status => {
                if (status.type === 'Finalised' && status.events !== undefined) {
                    let isRemoved = false;
                    for (let i = 0; i < status.events.length; i += 1) {
                        const event = status.events[i];
                        if (event.event.method === 'RemoveLiquidity') {
                            isRemoved = true;
                            const balance = await spotX.getLiquidityBalance(tradeAssetId, investor.address);
                            expect(balance.eqn(0)).toBeTruthy();
                            // TODO: check balance change of exchange account
                        }
                    }
                    // return isCreated event
                    expect(isRemoved).toEqual(true);
                    done();
                }
            });
        });
        it.skip('query', async done => {
            const typeRegistry = getTypeRegistry();
            const totalAmount: number = 200;
            const balance = await spotX.getLiquidityBalance(tradeAssetId, investor.address);
            const coreAssetId = await spotX.getCoreAssetId();
            const exchangeAddress = await spotX.getExchangeAddress(tradeAssetId);
            console.log('Exchange address:' + exchangeAddress);
            const total = await spotX.getTotalLiquidity(tradeAssetId);
            const coreBalance = await ga.getFreeBalance(coreAssetId, exchangeAddress);
            console.log('Core bal ' + coreBalance);
            const assetBalance = await ga.getFreeBalance(tradeAssetId, exchangeAddress);
            console.log('Trade bal ' + assetBalance);
            const feeRate = await spotX.getFeeRate();
            const expectPay = await spotX.getAssetToCoreOutputPrice(tradeAssetId, 50);
            done();
        });
    });
    it('can transfer ', async done => {
        const amountBought = 200;
        const tradeAssetBalanceBefore = (await ga.getFreeBalance(tradeAssetId, trader.address)) as BN;
        const coreAssetBalanceBefore = (await ga.getFreeBalance(coreAssetId, trader.address)) as BN;
        console.log(spotX);
        await ga.transfer(tradeAssetId, investor.address, amountBought).signAndSend(trader.address, async status => {
            if (status.type === 'Finalised') {
                const tradeAssetBalanceAfter = (await ga.getFreeBalance(tradeAssetId, trader.address)) as BN;
                const coreAssetBalanceAfter = (await ga.getFreeBalance(coreAssetId, trader.address)) as BN;
                const gas = coreAssetBalanceBefore.sub(coreAssetBalanceAfter);
                const pay = tradeAssetBalanceBefore.sub(tradeAssetBalanceAfter);
                const blockHash = status.status.asFinalised;
                const events = await api.query.system.events.at(blockHash);
                console.log('Events:' + events);

                done();
            }
        });
    });
    it('can trade from asset to core', async done => {
        const amountBought = 50;
        const tradeAssetBalanceBefore = (await ga.getFreeBalance(tradeAssetId, trader.address)) as BN;
        const coreAssetBalanceBefore = (await ga.getFreeBalance(coreAssetId, trader.address)) as BN;
        const expectPay = await spotX.getAssetToCoreOutputPrice(tradeAssetId, amountBought);
        console.log(expectPay);
        await spotX
            .assetToCoreSwapOutput(tradeAssetId, amountBought, 50000)
            .signAndSend(trader.address, async status => {
                if (status.type === 'Finalised') {
                    const tradeAssetBalanceAfter = (await ga.getFreeBalance(tradeAssetId, trader.address)) as BN;
                    const coreAssetBalanceAfter = (await ga.getFreeBalance(coreAssetId, trader.address)) as BN;
                    const gain = coreAssetBalanceAfter.sub(coreAssetBalanceBefore);
                    const pay = tradeAssetBalanceBefore.sub(tradeAssetBalanceAfter);
                    const blockHash = status.status.asFinalised;
                    const events = (await api.query.system.events.at(blockHash)) as Vector<EventRecord>;
                    const feeChargeEvent = events.find(event => event.event.data.method === 'Charged');
                    const gas = feeChargeEvent.event.data[1];
                    console.log(expectPay);
                    done();
                }
            });
    });
    it('can trade from core to asset', async done => {
        const amountBought = 50;
        const tradeAssetBalanceBefore = (await ga.getFreeBalance(tradeAssetId, trader.address)) as BN;
        const coreAssetBalanceBefore = (await ga.getFreeBalance(coreAssetId, trader.address)) as BN;
        await spotX
            .coreToAssetSwapOutput(tradeAssetId, amountBought, 50000)
            .signAndSend(trader.address, async status => {
                if (status.type === 'Finalised') {
                    const tradeAssetBalanceAfter = (await ga.getFreeBalance(tradeAssetId, trader.address)) as BN;
                    const coreAssetBalanceAfter = (await ga.getFreeBalance(coreAssetId, trader.address)) as BN;

                    const pay = coreAssetBalanceAfter.sub(coreAssetBalanceBefore);
                    const gain = tradeAssetBalanceBefore.sub(tradeAssetBalanceAfter);
                    const blockHash = status.status.asFinalised;
                    const events = (await api.query.system.events.at(blockHash)) as Vector<EventRecord>;
                    const feeChargeEvent = events.find(event => event.event.data.method === 'Charged');
                    const gas = feeChargeEvent.event.data[1];
                    // console.log(expectPay, );
                    done();
                }
            });
    });
    it('Get trade asset from buyer and transfer core asset to recipient for exact core asset amount', async done => {
        const amountBought = 50;
        const tradeAssetBalanceBefore = (await ga.getFreeBalance(tradeAssetId, trader.address)) as BN;
        const coreAssetBalanceBefore = (await ga.getFreeBalance(coreAssetId, recipient.address)) as BN;
        await spotX
            .assetToCoreTransferOutput(recipient.address, tradeAssetId, amountBought, 50000)
            .signAndSend(trader.address, async status => {
                if (status.type === 'Finalised') {
                    const tradeAssetBalanceAfter = (await ga.getFreeBalance(tradeAssetId, trader.address)) as BN;
                    const coreAssetBalanceAfter = (await ga.getFreeBalance(coreAssetId, recipient.address)) as BN;
                    const gain = coreAssetBalanceAfter.sub(coreAssetBalanceBefore);
                    const pay = tradeAssetBalanceBefore.sub(tradeAssetBalanceAfter);
                    const blockHash = status.status.asFinalised;
                    const events = (await api.query.system.events.at(blockHash)) as Vector<EventRecord>;
                    const feeChargeEvent = events.find(event => event.event.data.method === 'Charged');
                    const gas = feeChargeEvent.event.data[1];
                    done();
                }
            });
    });

    it('Get core asset from buyer and transfer trade asset to recipient for exact trade asset amount', async done => {
        const amountBought = 50;
        const tradeAssetBalanceBefore = (await ga.getFreeBalance(tradeAssetId, trader.address)) as BN;
        const coreAssetBalanceBefore = (await ga.getFreeBalance(coreAssetId, recipient.address)) as BN;
        await spotX
            .coreToAssetTransferOutput(recipient.address, tradeAssetId, amountBought, 50000)
            .signAndSend(trader.address, async status => {
                if (status.type === 'Finalised') {
                    const tradeAssetBalanceAfter = (await ga.getFreeBalance(tradeAssetId, trader.address)) as BN;
                    const coreAssetBalanceAfter = (await ga.getFreeBalance(coreAssetId, recipient.address)) as BN;
                    const gain = coreAssetBalanceAfter.sub(coreAssetBalanceBefore);
                    const pay = tradeAssetBalanceBefore.sub(tradeAssetBalanceAfter);
                    const blockHash = status.status.asFinalised;
                    const events = (await api.query.system.events.at(blockHash)) as Vector<EventRecord>;
                    const feeChargeEvent = events.find(event => event.event.data.method === 'Charged');
                    const gas = feeChargeEvent.event.data[1];
                    done();
                }
            });
    });
});
