import _, { Request, Response } from 'express';
import { K2 } from '@blockswaplab/k2-sdk';

import { getEnvVars } from "../services/env";
import { getProvider, getEffectiveBalanceForMultipleBLSKeys } from "../services/web3";
import { THIRTY_TWO_ETH_IN_GWEI } from "../services/constants";

/// @notice For K2 protocol native delegatoors, ensure that 32 ETH effective balance is maintained across all keys or flag offending keys
export async function invalidEffectiveBalanceHandler(_: Request, res: Response) {
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
}