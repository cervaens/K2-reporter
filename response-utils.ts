export const createResponse = (statusCode: number, body: any) => {
    return {
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Credentials': true
        },
        statusCode,
        body: JSON.stringify(body),
    }
};

export const createErrorMessage = (msg: string) => {
    return { error: { msg } };
};