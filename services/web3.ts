import {ethers} from "ethers";
import Web3 from "web3";
import axios from "axios";

type ValidatorReports = {
    validatorIndex: string;
    blsPublicKey: string;
    slashed: boolean;
    activeBalance: string;
    effectiveBalance: string;
};

const VALIDATORS_API = `eth/v1/beacon/states/finalized/validators`;

// @ts-ignore
export const getProvider = (providerUrl: string) => new ethers.providers.Web3Provider(new Web3.providers.HttpProvider(providerUrl));

export async function getEffectiveBalanceForMultipleBLSKeys(beaconNode: string, blsPublicKeys: Array<string>) {
    const batchLength = 75;
    try {
        const numberOfBLSKeys = blsPublicKeys.length;
        let beaconChainReports: Array<ValidatorReports> = [];
        console.log(`Fetching effective balances for ${numberOfBLSKeys} BLS keys in batches of ${batchLength} to the consensus`)

        for (let i = 0; i < Math.ceil(numberOfBLSKeys/batchLength); ++i) {
            console.log(`Processing batch ${i+1} of ${Math.ceil(numberOfBLSKeys/batchLength)}`);
            let query = "";
            let blsPublicKeysBatch = blsPublicKeys.slice(i*batchLength, Math.min(numberOfBLSKeys, (i+1)*batchLength));

            for (let j= 0; j < blsPublicKeysBatch.length; ++j) {
                if (j == (blsPublicKeysBatch.length - 1)){
                    query = query + "id=" + blsPublicKeysBatch[j];
                }
                else {
                    query = query + "id=" + blsPublicKeysBatch[j] + "&";
                }
            }

            let axiosResponse = await axios.get(`${beaconNode}/${VALIDATORS_API}?${query}`);

            let validatorData = [];
            validatorData = axiosResponse.data.data;

            for (let j=0; j < validatorData.length; ++j) {
                const { balance, validator, index } = validatorData[j];
                const {
                    pubkey,
                    effective_balance,
                    slashed
                } = validator;

                beaconChainReports.push({
                    validatorIndex: index.toString(),
                    blsPublicKey: pubkey,
                    slashed,
                    activeBalance: balance.toString(),
                    effectiveBalance: effective_balance.toString()
                });
            }
        }


        beaconChainReports.sort((a,b) => {
            return blsPublicKeys.indexOf(`0x${a.blsPublicKey}`) - blsPublicKeys.indexOf(`0x${b.blsPublicKey}`);
        })

        return beaconChainReports;

    } catch (e: any) {
        throw new Error('Error attempting to fetch effective balances for multiple BLS public keys')
    }
}