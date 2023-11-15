/// @title Automatically scan for liveness issues

import dotenv from 'dotenv';
import EventSource from 'eventsource';
import axios from 'axios';
import { utils } from 'ethers';

dotenv.config();

const K2_REPORTER_SERVER_URL = `http://localhost:${process.env.PORT}`;
const BEACON_URL = process.env.BEACON_URL;
const FINALITY_EVENTS = '/eth/v1/events?topics=finalized_checkpoint';
const FULL_CONSENSUS_LAYER_URL = `${BEACON_URL}${FINALITY_EVENTS}`;

async function checkLiveness(slot: number, debtor: string = '') {
    // Debtor is an optional parameter in the event the middleware is appointed for more than one SBP
    let debtorQuery = ''
    if (debtor !== '') {
        try {
            // Check the debtor address is valid before generating the query
            const debtorAddress = utils.getAddress(debtor)
            debtorQuery = `&debtor=${debtorAddress}`
        } catch (e: any) { /* Do nothing - there will just be no debtor query */ }
    }

    const { data } = await axios.get(`${K2_REPORTER_SERVER_URL}/liveness?slot=${slot}${debtorQuery}`)
    console.log('Liveness result', data)
}

async function main() {
    console.log('Starting up...')

    checkLiveness(5) // For demo purposes, slot 5 is a demo slot where liveness issues will be found

    // Use websockets to listen to the occurrence of new epochs as a trigger for checking liveness events
    let es = new EventSource(FULL_CONSENSUS_LAYER_URL, { headers: { Accept: "text/event-stream" } })
    es.addEventListener("finalized_checkpoint", async function(e) {
        const dataParsed = JSON.parse(e.data)
        const currentEpoch = Number(dataParsed.epoch)
        const finalizedEpoch = currentEpoch - 2
        const finalizedSlot = finalizedEpoch * 32
        console.log(`Event listener triggered for slot ${finalizedSlot}`)
        checkLiveness(finalizedSlot)
    })
}

main();