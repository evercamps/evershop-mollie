import { getConfig } from '@evershop/evershop/lib/util/getConfig';
import { MollieConfig } from '../../../types/mollieConfig.js';

export default {
  Setting: {
    molliePaymentStatus: (setting) => {
      const mollieConfig: MollieConfig = getConfig('system.mollie', {});
      if (mollieConfig.molliePaymentStatus) {
        return mollieConfig.molliePaymentStatus;
      }
      const molliePaymentStatus = setting.find(
        (s) => s.name === 'molliePaymentStatus'
      );
      if (molliePaymentStatus) {
        return parseInt(molliePaymentStatus.value, 10);
      } else {
        return 0;
      }
    },
    mollieDisplayName: (setting) => {
      const mollieDisplayName = setting.find(
        (s) => s.name === 'mollieDisplayName'
      );
      if (mollieDisplayName) {
        return mollieDisplayName.value;
      } else {
        return 'Mollie';
      }
    },
     molliePaymentMode: (setting) => {
      const mollieConfig: MollieConfig = getConfig('system.mollie', {});
      if (mollieConfig.molliePaymentMode) {
        return mollieConfig.molliePaymentMode;
      }
      const molliePaymentMode = setting.find(
        (s) => s.name === 'molliePaymentMode'
      );
      if (molliePaymentMode) {
        return parseInt(molliePaymentMode.value, 10);
      } else {
        return 0;
      }
    }
  }
};
