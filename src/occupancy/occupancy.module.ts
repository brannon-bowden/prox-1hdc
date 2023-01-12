import { CacheModule, Module } from '@nestjs/common';
import { OccupancyService } from './occupancy.service';
import { DatabaseFirebaseModule } from '../database-firebase/database-firebase.module';
import { PresenceDevicesModule } from 'src/presenceDevices/presenceDevice.module';
import { OccupancyController } from './occupancy.controller';
import { RabbitMqModule } from '../rabbit-mq/rabbit-mq.module';
import { EventEmitterModule } from '@nestjs/event-emitter';

@Module({
  imports: [
    CacheModule.register(),
    DatabaseFirebaseModule,
    PresenceDevicesModule,
    RabbitMqModule,
    EventEmitterModule.forRoot(),
  ],
  controllers: [OccupancyController],
  providers: [OccupancyService],
})
export class OccupancyModule {}
