export const wait = (p_milliSeconds: number) => new Promise(p_resolve => setTimeout(p_resolve, p_milliSeconds));

const retryOperation = (p_operation: any, p_delay: number, p_retries: number): Promise<any> => new Promise(
    (resolve, reject) => {
        return p_operation().then(
            resolve
        ).catch(
            (p_error: any) => {
                if (p_retries > 0) {
                    return wait(p_delay)
                        .then(retryOperation.bind(null, p_operation, p_delay, p_retries - 1))
                        .then(resolve)
                        .catch(reject);
                }
                return reject(p_error);
            }
        );
    }
);

export const promiseHelper = {
    retryOperation: retryOperation
};