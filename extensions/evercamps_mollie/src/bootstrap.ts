import { getConfig } from '@evershop/evershop/lib/util/getConfig';
import { hookAfter } from '@evershop/evershop/lib/util/hookable';
import { registerPaymentMethod } from '@evershop/evershop/checkout/services';
import { getSetting } from '@evershop/evershop/setting/services';
import { cancelPaymentIntent } from './services/cancelPayment.js';
import { MollieConfig } from './types/mollieConfig.js';

export default async () => {
  hookAfter('changePaymentStatus', async (order, orderID, status) => {
    if (status !== 'canceled') {
      return;
    }
    if (order.payment_method !== 'mollie') {
      return;
    }
    await cancelPaymentIntent(orderID);
  });

  registerPaymentMethod({
    init: async () => ({
      methodCode: 'mollie',
      methodName: await getSetting('mollieDisplayName', 'Mollie')
    }),
    validator: async () => {
      const mollieConfig: MollieConfig = getConfig('system.mollie', {});
      let mollieStatus;
      if (mollieConfig.molliePaymentStatus) {
        mollieStatus = mollieConfig.molliePaymentStatus;
      } else {
        mollieStatus = await getSetting('molliePaymentStatus', 0);
      }
      if (parseInt(mollieStatus, 10) === 1) {
        return true;
      } else {
        return false;
      }
    }
  });
};
