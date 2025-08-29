import { select } from '@evershop/postgres-query-builder';
import { error } from '@evershop/evershop/lib/log';
import { pool } from '@evershop/evershop/lib/postgres';
import { getMollieApiKey } from './getMollieApiKey.js';
import { createMollieClient} from '@mollie/api-client';

export async function cancelPaymentIntent(orderID) {
  try {
    const transaction = await select()
      .from('payment_transaction')
      .where('payment_transaction_order_id', '=', orderID)
      .load(pool);
    if (!transaction) {
      return;
    }

    const apiKey = await getMollieApiKey();
    const mollieClient = createMollieClient({ apiKey});

    
    // Get the payment intent
    const payment = await mollieClient.payments.get(transaction.transaction_id);
    
    if (!payment) {
      throw new Error('Can not find payment intent');
    }
    
    if(!payment.isCancelable) {
      return;
    }

    await mollieClient.payments.cancel(transaction.transaction_id);
  } catch (err) {
    error(err);
    throw err;
  }
}
