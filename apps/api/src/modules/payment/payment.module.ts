import { Module } from '@nestjs/common';

import { PaymentController } from './payment.controller';
import { PaymentService } from './payment.service';
import { RazorpayProvider } from './razorpay.provider';

@Module({
  controllers: [PaymentController],
  providers: [PaymentService, RazorpayProvider],
  exports: [PaymentService],
})
export class PaymentModule {}
