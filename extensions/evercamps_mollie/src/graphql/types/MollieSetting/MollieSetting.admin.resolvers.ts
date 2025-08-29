import { getConfig } from '@evershop/evershop/lib/util/getConfig';
import { MollieConfig } from '../../../types/mollieConfig.js';

export default {
  Setting: {
    mollieLiveApiKey: (setting) => {
      const mollieConfig: any = getConfig('system.mollie', {});
      if (mollieConfig.mollieLiveApiKey) {
           return `${mollieConfig.mollieLiveApiKey.substr(
          0,
          5
        )}*******************************`;
      }
      const mollieLiveApiKey = setting.find(
        (s) => s.name === 'mollieLiveApiKey'
      );
      if (mollieLiveApiKey) {
        return mollieLiveApiKey.value;
      } else {
        return null;
      }
    },
    mollieTestApiKey: (setting) => {
      const mollieConfig: MollieConfig = getConfig('system.mollie', {});
      if (mollieConfig.mollieTestApiKey) {
           return `${mollieConfig.mollieTestApiKey.substr(
          0,
          5
        )}*******************************`;
      }
      const mollieTestApiKey = setting.find(
        (s) => s.name === 'mollieTestApiKey'
      );
      if (mollieTestApiKey) {
        return mollieTestApiKey.value;
      } else {
        return null;
      }
    }
  }
};
