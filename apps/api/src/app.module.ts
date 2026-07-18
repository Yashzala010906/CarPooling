import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import configuration from './config/configuration';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { CompanyModule } from './modules/company/company.module';
import { VehicleModule } from './modules/vehicle/vehicle.module';
import { RideModule } from './modules/ride/ride.module';
import { BookingModule } from './modules/booking/booking.module';
import { TripModule } from './modules/trip/trip.module';
import { WalletModule } from './modules/wallet/wallet.module';
import { PaymentModule } from './modules/payment/payment.module';
import { ChatModule } from './modules/chat/chat.module';
import { NotificationModule } from './modules/notification/notification.module';
import { ReportsModule } from './modules/reports/reports.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, load: [configuration] }),
    PrismaModule,
    AuthModule,
    UsersModule,
    CompanyModule,
    VehicleModule,
    RideModule,
    BookingModule,
    TripModule,
    WalletModule,
    PaymentModule,
    ChatModule,
    NotificationModule,
    ReportsModule,
  ],
})
export class AppModule {}
