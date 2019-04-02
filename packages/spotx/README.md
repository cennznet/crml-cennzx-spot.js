# `@cennznet/spotx`

> The CENNZnet JavaScript API library for supporting Cennzx Spot (Exchange).



# Install

```
$> npm config set registry https://npm-proxy.fury.io/centrality/
$> npm login
$> npm i @cennznet/generic-asset @cennznet/api 
$> npm i @cennznet/spotx @cennznet/wallet @cennznet/util
```



# USAGE

node --experimental-repl-await
```
// initialize Api and connect to dev network
const {Api} = require('@cennznet/api')
const api = await Api.create({provider: 'wss://cennznet-node-0.centrality.me:9944'});

// initialize generic asset
const {GenericAsset} = require('@cennznet/generic-asset')
const {SpotX} = require('@cennznet/spotx')
const cennzxSpot = new SpotX(api);
await cennzxSpot.create(api);
const ga = spotX.ga;

// initialize wallet and import an account
const {SimpleKeyring, Wallet} = require('@cennznet/wallet')
const {stringToU8a} = require('@cennznet/util')
const assetOwner = {
    address: '5FPCjwLUkeg48EDYcW5i4b45HLzmCn4aUbx5rsCsdtPbTsKT',
    seed: stringToU8a('cennznetjstest'.padEnd(32, ' '))
}
const receiver = {
    address: '5EfqejHV2xUUTdmUVBH7PrQL3edtMm1NQVtvCgoYd8RumaP3',
    seed: stringToU8a('cennznetjstest2'.padEnd(32, ' '))
}

const testAsset = {
    id: 1000036,
    ownerAccount: '5FPCjwLUkeg48EDYcW5i4b45HLzmCn4aUbx5rsCsdtPbTsKT',
    initialIssuance: 10000000000
}

const simpleKeyring = new SimpleKeyring();
simpleKeyring.addFromSeed(assetOwner.seed);
const wallet = new Wallet();
const passphrase = 'passphrase';
await wallet.createNewVault(passphrase);
await wallet.addKeyring(simpleKeyring);
api.setSigner(wallet);

```

# DEMO CODE
```
const coreAssetId = 10;
const tradeAssetA = 0;
const tradeAssetB = 101;

// Add liquidity
await cennzxSpot
                .addLiquidity(tradeAssetA, 0, maxAssetAmount, investAmount)
                .signAndSend(investor.address, async status => {
                    if (status.type === 'Finalised' && status.events !== undefined) {
                        let isCreated = false;
                        for (let i = 0; i < status.events.length; i += 1) {
                            const event = status.events[i];
                            if (event.event.method === 'AddLiquidity') {
                      // Liquidity added      
                            }
                        }
                    }
                });
                
// Remove liquidity
await cennzxSpot.removeLiquidity(tradeAssetA, liquidity, 1, 1).signAndSend(investor.address, async status => {
                if (status.type === 'Finalised' && status.events !== undefined) {
                    let isRemoved = false;
                    for (let i = 0; i < status.events.length; i += 1) {
                        const event = status.events[i];
                        if (event.event.method === 'RemoveLiquidity') {
                        }
                    }
                }
            });
        
// Asset to core swap output
await cennzxSpot
            .coreToAssetSwapOutput(tradeAssetA, amountBought, 50000)
            .signAndSend(trader.address, async status => {
                if (status.type === 'Finalised') {
                    let trade = false;
                    for (let i = 0; i < status.events.length; i += 1) {
                        const event = status.events[i];
                        if (event.event.method === 'TradeAssetPurchase') { // check if ExtrinsicFailed or successful
                        }
                    }
                }
            });
  
// Core to asset swap output
await cennzxSpot
            .coreToAssetSwapInput(tradeAssetA, sellAmount, 30)
            .signAndSend(trader.address, async status => {
                if (status.type === 'Finalised') {
                    let trade = false;
                    for (let i = 0; i < status.events.length; i += 1) {
                        const event = status.events[i];
                        if (event.event.method === 'TradeAssetPurchase') { // check if ExtrinsicFailed or successful
                        }
                    }
                }
            });
        
        
// Get core asset from seller and transfer trade asset to recipient for exact trade asset amount
await cennzxSpot
            .coreToAssetTransferInput(recipient.address, tradeAssetA, sellAmount, 30)
            .signAndSend(trader.address, async status => {
                if (status.type === 'Finalised') {
                    let trade = false;
                    for (let i = 0; i < status.events.length; i += 1) {
                        const event = status.events[i];
                        if (event.event.method === 'TradeAssetPurchase') { // check if ExtrinsicFailed or successful
                        }
                    }
                }
            });
            
// 'Get trade asset from seller and transfer core asset to recipient for exact trade asset amount'

await cennzxSpot
            .assetToCoreTransferInput(recipient.address, tradeAssetA, sellAmount, 30)
            .signAndSend(trader.address, async status => {
                if (status.type === 'Finalised') {
                    let trade = false;
                    for (let i = 0; i < status.events.length; i += 1) {
                        const event = status.events[i];
                        if (event.event.method === 'CoreAssetPurchase') { // check if ExtrinsicFailed or successful
                        }
                    }
                }
            });

// Trade from asset "A" to asset "B" with exact asset B amount and max A amount

await cennzxSpot
            .assetToAssetSwapOutput(tradeAssetA, tradeAssetB, amountBought, 50000)
            .signAndSend(trader.address, async status => {
                if (status.type === 'Finalised') {
                    let trade = false;
                    for (let i = 0; i < status.events.length; i += 1) {
                        const event = status.events[i];
                        if (event.event.method === 'AssetToAssetPurchase') { // check if ExtrinsicFailed or successful
                        }
                    }
                }
            });
            
// Trade from asset "A" to asset "B" with exact asset B amount and max A amount and transfer asset "B" to recipient
await cennzxSpot
            .assetToAssetTransferOutput(recipient.address, tradeAssetA, tradeAssetB, amountBought, 50000)
            .signAndSend(trader.address, async status => {
                if (status.type === 'Finalised') {
                    let trade = false;
                    for (let i = 0; i < status.events.length; i += 1) {
                        const event = status.events[i];
                        if (event.event.method === 'AssetToAssetPurchase') { // check if ExtrinsicFailed or successful
                        }
                    }
                }
            });
```