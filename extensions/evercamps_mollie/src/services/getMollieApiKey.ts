import { getSetting } from '@evershop/evershop/setting/services';
import { getConfig } from '@evershop/evershop/lib/util/getConfig';
import { MollieConfig } from 'src/types/mollieConfig.js';

export async function getMollieApiKey() {
    const mollieConfig: MollieConfig = getConfig('system.mollie', {});

    let apiKey;

    if (mollieConfig.mollieLiveApiKey || mollieConfig.mollieTestApiKey) {
        apiKey = mollieConfig.molliePaymentMode ? mollieConfig.mollieLiveApiKey : mollieConfig.mollieTestApiKey;
    } 
    else {
        const mollieLiveApiKey = await getSetting('mollieLiveApiKey', null);
        const mollieTestApiKey = await getSetting('mollieTestApiKey', null);
        const molliePaymentMode = await getSetting('molliePaymentMode', '0');

        apiKey = parseInt(molliePaymentMode, 10) === 1 ? mollieLiveApiKey : mollieTestApiKey;
    }
    return apiKey;
}