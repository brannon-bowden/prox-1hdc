import { Module } from '@nestjs/common';
import { PresenceDevicesService } from './presenceDevice.service';
import { RabbitMqModule } from '../rabbit-mq/rabbit-mq.module';
import { DatabaseFirebaseModule } from 'src/database-firebase/database-firebase.module';

@Module({
  imports: [DatabaseFirebaseModule, RabbitMqModule],
  controllers: [],
  providers: [PresenceDevicesService],
  exports: [PresenceDevicesService],
})
export class PresenceDevicesModule {}
