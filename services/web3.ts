import {ethers} from "ethers";
import Web3 from "web3";

// @ts-ignore
export const getProvider = (providerUrl: string) => new ethers.providers.Web3Provider(new Web3.providers.HttpProvider(providerUrl));