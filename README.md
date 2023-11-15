# K2 Reporter

[K2 Reporter](https://github.com/restaking-cloud/K2-reporter) is a Typescript server that uses the [K2 SDK](https://github.com/restaking-cloud/k2-sdk) in order to work for the K2 protocol. 

More information regarding the K2 protocol can be found [here](https://restaking.cloud).

K2 reporters are paid in native ETH for:
- Slashing SBP (Slashable Borrow Positions) for detected liveness or corruption issues associated with software related to a service provider
- Kicking node operators with balances less than 32 ETH

and more soon!

When a protocol (referred to as a service provider) takes out Ethereum economic security coverage for their protocol, 
the SBP position will be created on chain and off chain they will spin up a middleware. The middleware software can be
seen [here](https://github.com/restaking-cloud/K2-middleware).

K2 reporters work alongside middlewares to scan for the liveness and corruption issues where middlewares will verify these
events according to their own custom slashing logic and if verified, will authorise slashing events, paying reporters in the process.

# Spinning up the reporter
## Installing dependencies

Yarn is the default package manager and therefore it's as simple as:

```
yarn
```

## Compiling

Triggering the typescript compiler can be done with

```
yarn build
```

## Configuring your environment

Before running the reporter, the environment needs to be set up. 

The following parameters are important to the reporter:
- Middleware API Endpoint
- Execution layer Node URL

Execution layer node URL can be any node provider like Quicknode, Alchemy etc.

Middleware API endpoint will be the middleware serving one or more SBP positions. Every middleware has a default
service provider borrow address but that can be overridden. Ultimately, when opening SBP positions on chain, borrowers
are nominating the public key of the designated verifier middleware that will validate and process slashings where
the contract will reject the slashing if it does not come from the correct designated verifier.

## Running

The reporter can be run in development mode which will monitor files for changes and re-start the server. To do that
run:

```
yarn dev
```

Alternatively, if you just want to run without making changes just run:
```
yarn start
```

If it is running correctly, you should see a message that the server is running on the configured host and port.

# Automatically doing liveness checks

After building and running the server, the following script can be run to automatically check for liveness issues:
```
node dist/liveness-scan.js
```

This will start by kicking off a liveness scan that you should be able to see on the reporter server:
```
⚡️[server]: Server is running at http://localhost:9998
Generating liveness report for slot 5
Verifying liveness report...
Liveness report verified!
```

Where a verified liveness report looks like the following from the script:
```javascript
{
  inputs: {
    rpbsSelfAttestation: {
      signature: [Object],
      commonInfo: [Object],
      publicKey: '63040bb1f0de4879a6019e2a51bab6b1e4f809a6b04ff48f3568d983355b6acddce4121ddec75039b57742e291f69fcc9ddb369023626c75a2efe86bce74ebe285a0'
    },
    eventType: 'LIVENESS',
    version: '1',
    eventData: {
      livenessData: [Object],
      proposedSlashing: '8468571428571428',
      query: '?slot=5'
    }
  },
  signedReport: {
    slashType: '0',
    debtor: '0xEa0F09A471dCe34d7d3675787....',
    signature: '0x3634303432353934656431....',
    amount: { type: 'BigNumber', hex: '0x1e161eefc14924' },
    identifier: 1
  },
  designatedVerifierSignature: {
    deadline: 9963956,
    v: 27,
    r: '0xe0ea16fdb9c99b60322776a5c1f1a8c0765fef294198027ded5297243401a1d2',
    s: '0x182fc2f56953f88f0bec778db395bbb62f03f33f104fa4612a162880dd23fef0'
  }
}
```

The slashing could then be reported to the reporter registry contract as simply as:
```typescript
import { K2 } from '@blockswaplab/k2-sdk';
const sdk = new K2(getProvider(PROVIDER_URL));
const contract = await sdk.contracts.reporterRegistry();
const transaction = await contract.batchSubmitReports(
    [{
        ...verifiedReport.signedReport,
        block: verifiedReport.designatedVerifierSignature.deadline
    }],
    [verifiedReport.designatedVerifierSignature]
)
console.log('transaction.hash', transaction.hash)
```

## Overriding the debtor

Multiple SBPs taken out for the same type of re-staking application which share a common middleware instance will require
a debtor address override (owner of the SBP) when slashing the SBP position.

The `checkLiveness` function in the `liveness-scan` script covers how to do this and interact with the liveness API
```
async function checkLiveness(slot: number, debtor: string = '')
```