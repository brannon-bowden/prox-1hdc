import { forwardRef, Module } from '@nestjs/common';
import { RabbitMqService } from './rabbit-mq.service';
import { RabbitMQModule } from '@golevelup/nestjs-rabbitmq';
import { BWS_HOST_NAME, RABBIT_URL } from '../common/helpers/constants';
import { PresenceDevicesModule } from 'src/presenceDevices/presenceDevice.module';

@Module({
  imports: [
    RabbitMQModule.forRoot(RabbitMQModule, {
      exchanges: [
        {
          name: `feedback-${BWS_HOST_NAME}`,
          type: 'fanout',
        },
        {
          name: `request-${BWS_HOST_NAME}`,
          type: 'fanout',
        },
      ],
      uri: `${RABBIT_URL}`,
    }),
    forwardRef(() => PresenceDevicesModule),
  ],
  controllers: [],
  providers: [RabbitMqService],
  exports: [RabbitMqService],
})
export class RabbitMqModule {}
