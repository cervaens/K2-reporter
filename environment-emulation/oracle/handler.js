const { formResponse, formErrorMessage } = require("./response-utils");

/// @dev Checks for oracle price
const oracle = async (req) => {
  if (!req || !req.queryStringParameters) {
    return formResponse(500, formErrorMessage("Invalid query"));
  }

  const query = req.queryStringParameters;
  console.log("Query", query);

  // Randomizing results:
  const randomPercentage = 1 + Math.random() / 500;

  // Emultaing prices for some tokens
  // Based on the outcome, a reporter would slash accordingly
  let tokenPricesData;
  if (query.slot) {
    tokenPricesData = {
      ETH: (2348 * randomPercentage).toString(),
      BTC: (42500 * randomPercentage).toString(),
      MATIC: (1 * randomPercentage).toString(),
    };
  }

  return formResponse(200, {
    tokenPricesData,
  });
};

module.exports = {
  oracle,
};
