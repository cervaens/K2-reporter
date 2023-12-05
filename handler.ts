import express, { Express, Request, Response } from 'express';
import dotenv from 'dotenv';

import { getProvider, getEffectiveBalanceForMultipleBLSKeys } from "./services/web3";
import { getEnvVars } from "./services/env";

import { K2 } from '@blockswaplab/k2-sdk';

dotenv.config();
const app: Express = express();

const THIRTY_TWO_ETH_IN_GWEI = 32 * 10 ** 9;

app.get('/', async (_: Request, res: Response) => {
    res.status(200);
    res.send('K2 Reporter is alive!');
});

/// @notice For a given configured middleware, get a signed and verified liveness report for the specified slot number that can be used to flag liveness issues
app.get('/liveness', async (req: Request, res: Response) => {
    const { MIDDLEWARE_API, PROVIDER_URL } = getEnvVars();

    // Gather the query params
    if (!req.query || !req.query.slot) {
        res.send('No slot supplied');
        res.status(500);
        return;
    }

    // Spin up the K2 SDK
    const sdk = new K2(getProvider(PROVIDER_URL));

    console.log(`Generating liveness report for slot ${req.query.slot}`);

    // For the current slot, collect the liveness report
    const livenessReport = await sdk.utils.generateLivenessReport(
        MIDDLEWARE_API,
        req.query.debtor ? req.query.debtor as string : null,
        `?slot=${req.query.slot}`
    );

    // If there are liveness issues, get a report verified
    console.log('Verifying liveness report...')
    const verifiedReport = await sdk.utils.verifyReport(
        MIDDLEWARE_API,
        livenessReport
    )

    console.log('Liveness report verified!')

    res.status(200);
    res.send(verifiedReport);
});

/// @notice For K2 protocol native delegatoors, ensure that 32 ETH effective balance is maintained across all keys or flag offending keys
app.get('/invalid-effective-balances', async (req: Request, res: Response) => {
    const { PROVIDER_URL, BEACON_URL } = getEnvVars();

    const sdk = new K2(getProvider(PROVIDER_URL));

    console.log('Collecting list of BLS public keys with active delegations...')
    const k2ProtocolBLSPublicKeysToCheck: Array<any> = await sdk.utils.getAllDelegetedBLSPublicKeys();

    console.log('Collecting effective balances for all protocol native delegation keys...')
    const effectiveBalanceReports = await getEffectiveBalanceForMultipleBLSKeys(
        BEACON_URL,
        k2ProtocolBLSPublicKeysToCheck.map(k => k.id)
    );

    const keysWithLessThan32EffectiveBalance = effectiveBalanceReports.filter(
        r => r.effectiveBalance !== THIRTY_TWO_ETH_IN_GWEI.toString()
    );

    console.log(`Found ${keysWithLessThan32EffectiveBalance.length} BLS public keys with effective balances < 32 ether`);
    res.status(200);
    res.json({
        keysWithLessThan32EffectiveBalance
    });
});

const { PORT } = process.env;
app.listen(PORT, () => {
    console.log(`⚡️[server]: Server is running at http://localhost:${PORT}`);
});