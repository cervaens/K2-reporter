import _, { Request, Response } from 'express';
import { ethers } from 'ethers';
import { K2 } from '@blockswaplab/k2-sdk';

import { getEnvVars } from "../services/env";
import { getProvider } from "../services/web3";
import { getProposerStatusAsEncodedCall, getProposerRegistryAddress } from "../services/proposer-registry";

type LifecycleStatus = {
    blsPublicKey: string;
    status: number;
}

/// @notice For K2 protocol native delegatoors, ensure that pon login is still valid if not flag the offending BLS public keys
export async function invalidPonLoginHandler(_: Request, res: Response) {
    const { PROVIDER_URL } = getEnvVars();

    const provider = getProvider(PROVIDER_URL);
    const chainId: number = Number((await provider.getNetwork()).chainId)
    const sdk = new K2(provider);

    console.log(`Collecting list of BLS public keys with active delegations on chain ${chainId}...`)
    let k2ProtocolBLSPublicKeysToCheck: Array<any> = await sdk.utils.getAllDelegetedBLSPublicKeys();
    k2ProtocolBLSPublicKeysToCheck = k2ProtocolBLSPublicKeysToCheck.map(k => k.id);

    console.log(`Checking PON registry registrations for ${k2ProtocolBLSPublicKeysToCheck.length} native delegations`)
    
    // Use multicall3 to read data for multiple BLS keys in 1 go. Since we have asked it not to fail, we can discard the result part of the response
    let membershipResults: any = await sdk.utils.readUsingMulticall(
        getProposerRegistryAddress(chainId),
        false,
        k2ProtocolBLSPublicKeysToCheck.map(k => getProposerStatusAsEncodedCall(chainId, k))
    )
    membershipResults = membershipResults.map((r: any) => r[1]) // r[0] is the result which is always 'true' in this case

    // The proposer registry returns a lifecycle status - map that to a number and check that validator is not exiting
    const lifecycleStatuses: LifecycleStatus[] = membershipResults.map((r: string, i: number) => ({
        blsPublicKey:  k2ProtocolBLSPublicKeysToCheck[i],
        status: Number(ethers.BigNumber.from(r).toString())
    }))

    let blsKeysWithInvalidPoNLogin: string[] = [];
    for (let i = 0; i < lifecycleStatuses.length; ++i) {
        if (
            lifecycleStatuses[i].status == 3    // EXIT_PENDING
            || lifecycleStatuses[i].status == 4 // EXITED
            || lifecycleStatuses[i].status == 5 // KICKED
        ) {
            blsKeysWithInvalidPoNLogin.push(lifecycleStatuses[i].blsPublicKey);
        }
    }

    res.status(200);
    res.json({
        blsKeysWithInvalidPoNLogin
    });
}