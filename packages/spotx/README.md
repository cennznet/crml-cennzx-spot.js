# `@cennznet/spotx`

> The CENNZnet JavaScript API library for supporting Cennzx Spot (Exchange).



# Install

```
$> npm i @cennznet/crml-generic-asset @cennznet/api 
$> npm i @cennznet/crml-cennzx-spot @cennznet/wallet @cennznet/util
```



# USAGE

node --experimental-repl-await
```
// initialize Api and connect to dev network
const {Api} = require('@cennznet/api')
const api = await Api.create({provider: 'wss://rimu.unfrastructure.io/ws?apikey=***'});

// initialize generic asset
const {GenericAsset} = require('@cennznet/crml-generic-asset')
const {SpotX} = require('@cennznet/crml-cennzx-spot')
const cennzxSpot = new SpotX(api);
await cennzxSpot.create(api);
const ga = spotX.ga;

// initialize wallet and import an account
const {SimpleKeyring, Wallet} = require('@cennznet/wallet')
const {stringToU8a} = require('@cennznet/util')
const assetOwner = {
    address: '5DXUeE5N5LtkW97F2PzqYPyqNkxqSWESdGSPTX6AvkUAhwKP',
    uri: '//cennznet-js-test',
};
const receiver = {
    address: '5ESNjjzmZnnCdrrpUo9TBKhDV1sakTjkspw2ZGg84LAK1e1Y'
};

const simpleKeyring = new SimpleKeyring();
simpleKeyring.addFromUri(assetOwner.uri);
const wallet = new Wallet();
const passphrase = 'passphrase';
await wallet.createNewVault(passphrase);
await wallet.addKeyring(simpleKeyring);
api.setSigner(wallet);

```

# DEMO CODE
```
const coreAssetId = 16001;
const tradeAssetA = 16000;
const tradeAssetB = 16002;

// Add liquidity
const investAmount: number = 1000;
const maxAssetAmount = '1000';
await cennzxSpot
                .addLiquidity(tradeAssetA, 0, maxAssetAmount, investAmount)
                .signAndSend(investor.address, ({events, status}: SubmittableResult) => {
                    if (status.isFinalized && events !== undefined) {
                        let isCreated = false;
                        for (let i = 0; i < status.events.length; i += 1) {
                            const event = events[i];
                            if (event.event.method === 'AddLiquidity') {
                      // Liquidity added      
                            }
                        }
                    }
                });
                
// Remove liquidity
#liquidity -> amount to remove
await cennzxSpot.removeLiquidity(tradeAssetA, liquidity, 1, 1)
				.signAndSend(investor.address, ({events, status}: SubmittableResult) => {
                    if (status.isFinalized && events !== undefined) {
                    let isRemoved = false;
                    for (let i = 0; i < status.events.length; i += 1) {
                        const event = events[i];
                        if (event.event.method === 'RemoveLiquidity') {
                        }
                    }
                }
            });
        
// Asset to core swap output
await cennzxSpot
            .coreToAssetSwapOutput(tradeAssetA, amountBought, 50000)
            .signAndSend(trader.address, ({events, status}: SubmittableResult) => {
                    if (status.isFinalized && events !== undefined) {
                    let trade = false;
                    for (let i = 0; i < status.events.length; i += 1) {
                        const event = events[i];
                        if (event.event.method === 'TradeAssetPurchase') { // check if ExtrinsicFailed or successful
                        }
                    }
                }
            });
  
// Core to asset swap output
await cennzxSpot
            .coreToAssetSwapInput(tradeAssetA, sellAmount, 30)
            .signAndSend(trader.address, ({events, status}: SubmittableResult) => {
                    if (status.isFinalized && events !== undefined) {
                    let trade = false;
                    for (let i = 0; i < status.events.length; i += 1) {
                        const event = events[i];
                        if (event.event.method === 'TradeAssetPurchase') { // check if ExtrinsicFailed or successful
                        }
                    }
                }
            });
        
        
// Get core asset from seller and transfer trade asset to recipient for exact trade asset amount
await cennzxSpot
            .coreToAssetTransferInput(recipient.address, tradeAssetA, sellAmount, 30)
            .signAndSend(trader.address, ({events, status}: SubmittableResult) => {
                    if (status.isFinalized && events !== undefined) {
                    let trade = false;
                    for (let i = 0; i < status.events.length; i += 1) {
                        const event = events[i];
                        if (event.event.method === 'TradeAssetPurchase') { // check if ExtrinsicFailed or successful
                        }
                    }
                }
            });
            
// 'Get trade asset from seller and transfer core asset to recipient for exact trade asset amount'

await cennzxSpot
            .assetToCoreTransferInput(recipient.address, tradeAssetA, sellAmount, 30)
            .signAndSend(trader.address, ({events, status}: SubmittableResult) => {
                   if (status.isFinalized && events !== undefined) {
                    let trade = false;
                    for (let i = 0; i < status.events.length; i += 1) {
                        const event = events[i];
                        if (event.event.method === 'CoreAssetPurchase') { // check if ExtrinsicFailed or successful
                        }
                    }
                }
            });

// Trade from asset "A" to asset "B" with exact asset B amount and max A amount

await cennzxSpot
            .assetToAssetSwapOutput(tradeAssetA, tradeAssetB, amountBought, 50000)
            .signAndSend(trader.address, ({events, status}: SubmittableResult) => {
                   if (status.isFinalized && events !== undefined) {
                    let trade = false;
                    for (let i = 0; i < status.events.length; i += 1) {
                        const event = events[i];
                        if (event.event.method === 'AssetToAssetPurchase') { // check if ExtrinsicFailed or successful
                        }
                    }
                }
            });
            
// Trade from asset "A" to asset "B" with exact asset B amount and max A amount and transfer asset "B" to recipient
await cennzxSpot
            .assetToAssetTransferOutput(recipient.address, tradeAssetA, tradeAssetB, amountBought, 50000)
            .signAndSend(trader.address, ({events, status}: SubmittableResult) => {
                   if (status.isFinalized && events !== undefined) {
                    let trade = false;
                    for (let i = 0; i < status.events.length; i += 1) {
                        const event = events[i];
                        if (event.event.method === 'AssetToAssetPurchase') { // check if ExtrinsicFailed or successful
                        }
                    }
                }
            });
```