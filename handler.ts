import express, { Express } from "express";
import dotenv from "dotenv";

import { RC } from "./services/ascii";
import { infoHandler } from "./handlers/info";
import { livenessHandler } from "./handlers/liveness";
import { invalidEffectiveBalanceHandler } from "./handlers/effective-balance";
import { invalidPonLoginHandler } from "./handlers/pon-login";
import { oracleCorruptionHandler } from "./handlers/oracle-corruption";

dotenv.config();
const app: Express = express();

app.get("/", infoHandler);
app.get("/liveness", livenessHandler);
app.get("/invalid-effective-balances", invalidEffectiveBalanceHandler);
app.get("/invalid-pon-login", invalidPonLoginHandler);
app.get("/oracle-corruption", oracleCorruptionHandler);

const { PORT } = process.env;
app.listen(PORT, () => {
  console.log(RC);
  console.log(
    `⚡️[server]: K2 Reporter is running at http://localhost:${PORT}`
  );
});
