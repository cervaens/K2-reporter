import { ethers } from "ethers";
import ProposerRegistryABI from "./abis/ProposerRegistry.json";

export function getProposerRegistryAddress(chainId: number): string {
    return chainId === 1 ? '0xF7F6D8F8b76E94379034d333f4B5FE1694A32D87' : '0x1643ec804d944Da97d90c013cBaCD1358Cce1bAF';
}

export function getProposerStatusAsEncodedCall(chainId: number, blsPublicKey: string): string {
    const contract = new ethers.Contract(getProposerRegistryAddress(chainId), ProposerRegistryABI, undefined)
    return contract.interface.encodeFunctionData(
        'getProposerStatus',
        [
            blsPublicKey
        ]
    )
}