type EnvVars = {
    MIDDLEWARE_API: string;
    PROVIDER_URL: string;
    BEACON_URL: string;
}

export function getEnvVars(): EnvVars {
    const envVars = process.env;
    if (
        !envVars.MIDDLEWARE_API
        || !envVars.PROVIDER_URL
        || !envVars.BEACON_URL
    ) {
        throw new Error('One or more missing environment variables')
    }

    return {
        MIDDLEWARE_API: envVars.MIDDLEWARE_API as string,
        PROVIDER_URL: envVars.PROVIDER_URL as string,
        BEACON_URL: envVars.BEACON_URL as string,
    };
}