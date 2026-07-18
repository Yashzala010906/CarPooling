import { Injectable, NotImplementedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * Razorpay TEST MODE integration — PLACEHOLDER (spec 7).
 *
 * Planned responsibilities:
 *  - createOrder(amount, receiptId): create a test-mode order
 *  - verifySignature(orderId, paymentId, signature): HMAC verification
 *  - handleWebhook(event): payment.captured / payment.failed
 *
 * Real money transactions are NOT required; only rzp_test_* keys are used.
 */
@Injectable()
export class RazorpayProvider {
  constructor(private readonly config: ConfigService) {}

  async createOrder(_amountInPaise: number, _receiptId: string) {
    // TODO: const rzp = new Razorpay({ key_id, key_secret }); return rzp.orders.create(...)
    throw new NotImplementedException('Razorpay createOrder not implemented');
  }

  verifySignature(_orderId: string, _paymentId: string, _signature: string): boolean {
    // TODO: HMAC-SHA256 over `${orderId}|${paymentId}` with the key secret
    throw new NotImplementedException('Razorpay verifySignature not implemented');
  }
}
