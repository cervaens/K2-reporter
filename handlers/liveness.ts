import _, { Request, Response } from 'express';
import { K2 } from '@blockswaplab/k2-sdk';

import { getEnvVars } from "../services/env";
import { getProvider } from "../services/web3";

/// @notice For a given configured middleware, get a signed and verified liveness report for the specified slot number that can be used to flag liveness issues
export async function livenessHandler(req: Request, res: Response) {
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
}