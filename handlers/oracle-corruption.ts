import axios from "axios";
import _, { Request, Response } from "express";

// Just storing the existing oracles, should be in a DB
const Oracle = {
  oracleOne: "http://localhost:1111",
  oracleTwo: "http://localhost:2222",
  oracleThree: "http://localhost:3333",
  oracleFour: "http://localhost:4444",
};

/// @notice Check for oracle corruption
export async function oracleCorruptionHandler(req: Request, res: Response) {
  // Gather the query params
  if (
    !req.query ||
    !req.query?.oracle ||
    !Object.keys(Oracle).includes(req.query.oracle as string)
  ) {
    res.send("Oracle to be tested not valid.");
    res.status(500);
    return;
  }
  if (!req.query || !req.query.slot) {
    res.send("No slot supplied");
    res.status(500);
    return;
  }

  console.log(`Generating oracle corruption report for slot ${req.query.slot}`);

  // For the current slot, collect the oracle corruption report
  const oracleCorruptionReport = await generateOracleCorruptionReport(
    Oracle[req.query.oracle as keyof typeof Oracle],
    Number(req.query.slot)
  );

  // Skipping verifyReport as no middleware
  console.log("Verifying oracle corruption report...");
  console.log("Oracle corruption report verified!");

  res.status(200);
  res.send(oracleCorruptionReport);
}

async function generateOracleCorruptionReport(oracleUrl: string, slot: number) {
  const { data: oracleData } = await axios.get(
    `${oracleUrl}/oracle?slot=${slot}`
  );
  console.log("Oracle result", oracleData);

  // Checking other oracles, considered observability oracles
  const urlsObservability = Object.values(Oracle).filter(
    (elem) => elem !== oracleUrl
  );

  const promises = [];
  for (let url of urlsObservability) {
    promises.push(axios.get(`${url}/oracle?slot=${slot}`));
  }

  const observabilityResults = await Promise.all(promises).catch((err) => {
    console.error(`Found an issue when polling oracles. Cancelling: ${err}`);
    throw new Error(`Found an issue when polling oracles. Cancelling.`);
  });

  return analyseResults(observabilityResults, oracleData?.tokenPricesData);
}

async function analyseResults(
  results: Array<Record<any, any>>,
  oracleData: Record<any, any>
) {
  const deviationThreshold = 0.001;
  for (let result of results) {
    const { tokenPricesData } = result?.data;
    for (let token of Object.keys(oracleData)) {
      if (!tokenPricesData[token]) {
        throw new Error(`Token ${token} not present in observability oracle`);
      }
      const tokenDeviation = Math.abs(
        1 - oracleData[token] / tokenPricesData[token]
      );
      if (tokenDeviation > deviationThreshold) {
        return {
          slashing: true,
          error: {
            token,
            tokenDeviationPercent: tokenDeviation * 100,
            oracleData: oracleData[token],
            observabilityData: tokenPricesData[token],
          },
        };
      }
    }
  }
  return { slashing: false };
}
