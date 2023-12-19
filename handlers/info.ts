import _, { Request, Response } from 'express';
import { getEnvVars } from "../services/env";

export async function infoHandler(_: Request, res: Response) {
    const { PROVIDER_URL, BEACON_URL, MIDDLEWARE_API } = getEnvVars();
    res.status(200);
    res.json({
        info: 'K2 Reporter is alive!',
        config: {
            PROVIDER_URL,
            BEACON_URL,
            MIDDLEWARE_API
        }
    });
}