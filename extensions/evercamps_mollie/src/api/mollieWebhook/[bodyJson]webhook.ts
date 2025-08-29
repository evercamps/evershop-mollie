import {
  insert,
  startTransaction,
  commit,
  rollback,
  select
} from '@evershop/postgres-query-builder';
import { emit } from '@evershop/evershop/lib/event';
import { debug, error } from '@evershop/evershop/lib/log';
import { getConnection } from '@evershop/evershop/lib/postgres';
import { updatePaymentStatus } from '@evershop/evershop/oms/services';
import { getMollieApiKey } from '../../services/getMollieApiKey.js';
import { createMollieClient } from '@mollie/api-client';
import { INVALID_PAYLOAD } from '@evershop/evershop/lib/util/httpStatus';

export default async (request, response, next) => {

  const paymentId = request.body.id;

  debug(`Received webhook call with payment id: ${paymentId}`);

  const connection = await getConnection();

  try {

    await startTransaction(connection);
    const transaction = await select()
      .from('payment_transaction')
      .where('transaction_id', '=', paymentId)
      .load(connection);


    if (!transaction) {
      error("transaction id not found");
      response.status(200).send();
    }

    const order = await select()
      .from('order')
      .where('order_id', '=', transaction.payment_transaction_order_id)
      .load(connection);

    const apiKey = await getMollieApiKey();

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

    const payment = await mollieClient.payments.get(paymentId);

    if (!payment) {
      error("no payment found");
      response.json({ received: true });
      return;
    }

    debug(JSON.stringify(payment));

    switch (payment.status) {
      case "paid":
        debug(`payment status paid received: ${paymentId}`);

        if (order.payment_status === 'paid' || order.payment_status === 'refunded' || order.payment_status === 'partial_refunded') {
          debug(`${JSON.stringify(payment.amountRefunded)}`);
          if (payment.amountRefunded && Number(payment.amountRefunded.value) > 0) {
            // if the order was already in the paid status, then there was a possible refund happening

            // // Update the order status
            const status = Number(payment.amountRemaining?.value) <= 0 ? 'refunded' : 'partial_refunded';
            await updatePaymentStatus(order.order_id, status, connection);

            // using fetch-API as mollieClient is not working
            const response = await fetch(`https://api.mollie.com/v2/payments/${paymentId}/refunds`, {
              headers: {
                method: "GET",
                'Authorization': `Bearer ${apiKey}`
              }
            }
            );
            const refunds = await response.json();

            let comment = "";
            for (const refund of refunds._embedded.refunds) {
              comment += `Refund with id ${refund.id} - amount: ${refund.amount.value} ${refund.amount.currency} - status: ${refund.status}\n`;
            }

            // const comment = `Refunded ${payment.amountRefunded.value} ${payment.amountRefunded.currency}, remaining: ${payment.amountRemaining.value} ${payment.amountRemaining.currency}`
            await insert('order_activity')
              .given({
                order_activity_order_id: order.order_id,
                comment
              })
              .execute(connection);
          }
          else {
            debug(`nogthing happend ${JSON.stringify(payment.amountRefunded)}`)
          }
        }
        else {
          // Update the order
          await updatePaymentStatus(order.order_id, 'paid', connection);

          // Add an activity log
          await insert('order_activity')
            .given({
              order_activity_order_id: order.order_id,
              comment: `Customer paid by using Mollie.`
            })
            .execute(connection);

          // Emit event to add order placed event // do I need to do this?
          await emit('order_placed', { ...order });
        }
        break;
      case "expired":
      case "failed":
        debug('payment expired or failed status received');
        await updatePaymentStatus(order.order_id, 'canceled', connection);
        // Add an activity log
        await insert('order_activity')
          .given({
            order_activity_order_id: order.order_id,
            comment: `Payment was expired or failed`
          })
          .execute(connection);
        break;
      case "authorized":
        break;
      case "canceled":
        debug('payment canceled status received');
        await updatePaymentStatus(order.order_id, 'canceled', connection);
        // Add an activity log
        await insert('order_activity')
          .given({
            order_activity_order_id: order.order_id,
            comment: `Customer canceled the payment.`
          })
          .execute(connection);
        break;
      default: {
        debug(`Unhandled mollie status type ${payment.status}`);
      }
    }

    await commit(connection);
    // Return a response to acknowledge receipt of the event
    response.json({ received: true });

  } catch (err) {
    error(err);
    await rollback(connection);
    response.status(400).send(`Webhook Error: ${err.message}`);
  }
};
