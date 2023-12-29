# K2 Reporter Oracle Corruption

The goal is to extend K2 Reporter to have an oracle corruption check.

So 4 oracles were defined in the app with names: oracleOne,oracleTwo,oracleThree,oracleFour (this should be stored in a DB but for now are hardcoded). To check the corruption of an oracle the following endpoint needs to be called:

```
http://localhost:9999/oracle-corruption?oracle=oracleOne&slot=4
```

The Reporter will identify the oracle, call its url and compare the price results with the remaining 3 oracles (considered as observability points)

No report is generated as we're not using the middleware to generate them, so this app simply returns f.e. a slashing response:

```
{"slashing":true,"error":{"token":"ETH","tokenDeviationPercent":0.15261278066172057,"oracleData":"2352.2096142072296","observabilityData":"2348.625311811549"}}
```

or non-slashing:

```
{"slashing":false}
```

Each oracle randomizes at each call, so one call can return {slashing: true} and the following call to the same url can return {slashing:false}

# Spinning up the 4 oracles

```
docker-compose up --build
```

# Spinning up the reporter

## Installing dependencies

Yarn is the default package manager and therefore it's as simple as:

```
yarn
```

## Compiling

Triggering the typescript compiler can be done with

```
yarn build
```

## Configuring your environment

Before running the reporter, the environment needs to be set up.

Just create a .env file from .env.example and fill any info in the 3 empty variables as they won't be used but will be checked if not empty

## Running

The reporter can be run in development mode which will monitor files for changes and re-start the server. To do that
run:

```
yarn dev
```

Alternatively, if you just want to run without making changes just run:

```
yarn start
```

If it is running correctly, you should see a message that the server is running on the configured host and port.
