type EnvVars = {
    MIDDLEWARE_API: string;
    PROVIDER_URL: string;
}

export function getEnvVars(): EnvVars {
    if (!process.env.MIDDLEWARE_API || !process.env.PROVIDER_URL) {
        throw new Error('Missing environment variables')
    }

    return {
        MIDDLEWARE_API: process.env.MIDDLEWARE_API as string,
        PROVIDER_URL: process.env.PROVIDER_URL as string,
    }
}