import { select, insert } from '@evershop/postgres-query-builder';
import { createMollieClient } from '@mollie/api-client';
import { pool } from "@evershop/evershop/lib/postgres";
import { OK, INVALID_PAYLOAD } from '@evershop/evershop/lib/util/httpStatus';
import { debug, error } from '@evershop/evershop/lib/log';
import { updatePaymentStatus } from '@evershop/evershop/oms/services';
import { buildAbsoluteUrl } from '@evershop/evershop/lib/router';
import { getMollieApiKey } from '../../services/getMollieApiKey.js';

export default async (request, response, next) => {
  try {
    const { order_id } = request.body;
    debug(`Mollie create payment from order ${order_id}`);

    const order = await select()
      .from('order')
      .where('uuid', '=', order_id)
      .and('payment_method', '=', 'mollie')
      .and('payment_status', '=', 'pending')
      .load(pool);

    if (!order) {
      response.status(INVALID_PAYLOAD);
      response.json({
        error: {
          status: INVALID_PAYLOAD,
          message: 'Invalid order'
        }
      });
      return;
    }

    const apiKey = await getMollieApiKey();
    debug(`getMollie Api key ${apiKey}`);
    
    if (!apiKey) {
      response.status(INVALID_PAYLOAD);
      response.json({
        error: {
          status: INVALID_PAYLOAD,
          message: 'Invalid apikey'
        }
      });
    }

    debug(`Mollie create client with apikey ${apiKey}`);

    const mollieClient = createMollieClient({ apiKey: apiKey });

    debug(`Create Mollie payment with total amount ${new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(order.grand_total)}`);


    // Create a Payment with the order amount and currency
    const payment = await mollieClient.payments.create({
      amount: {
        value: new Intl.NumberFormat('en-US', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2
        }).format(order.grand_total),
        currency: order.currency
      },
      description: `Payment for order #${order.order_number}`,
      redirectUrl: buildAbsoluteUrl("checkoutSuccess", { orderId: order_id }),
      webhookUrl: buildAbsoluteUrl("mollieWebhook"),
      metadata: {
        order_id
      }
    });

    await updatePaymentStatus(order.order_id, 'pending', pool);

    // Add transaction data to database
    await insert('payment_transaction')
      .given({
        payment_transaction_order_id: order.order_id,
        transaction_id: payment.id,
        amount: order.grand_total,
        currency: order.currency,
        payment_action: 'capture',
        transaction_type: 'online',
        additional_information: JSON.stringify(payment)
      })
      .execute(pool);

    await insert('order_activity')
      .given({
        order_activity_order_id: order.order_id,
        comment: `Customer authorized by using Mollie. Transaction ID: ${payment.id}`
      })
      .execute(pool);

    response.status(OK);
    response.json({
      data: {
        returnUrl: payment.getCheckoutUrl()
      }
    });
  }
  catch (err) {
    error(err);
    return next(err);
  }
};
