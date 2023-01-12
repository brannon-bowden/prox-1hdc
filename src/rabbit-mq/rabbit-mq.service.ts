import { forwardRef, Inject, Injectable, Logger } from '@nestjs/common';
import { RabbitSubscribe, AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import { EventEmitter } from 'events';
import { BWS_HOST_NAME, SERVICE_NAME } from '../common/helpers/constants';
import { PresenceDevicesService } from 'src/presenceDevices/presenceDevice.service';

@Injectable()
export class RabbitMqService {
  constructor(
    private readonly amqpConnection: AmqpConnection,
    @Inject(forwardRef(() => PresenceDevicesService))
    private readonly presenceDeviceService: PresenceDevicesService
  ) {
    this.rabbitMQEvent = new EventEmitter();
    this.rabbitMQEvent.setMaxListeners(0);
  }
  rabbitMQEvent: EventEmitter;
  private logger: Logger = new Logger(RabbitMqService.name);
  @RabbitSubscribe({
    exchange: `feedback-${BWS_HOST_NAME}`,
    queue: `feedback-${BWS_HOST_NAME}-${SERVICE_NAME}`,
    //This must be set to empty string
    routingKey: '',
    createQueueIfNotExists: true,
    queueOptions: {
      durable: true,
      autoDelete: false,
      messageTtl: 60000,
    },
  })
  public async feedbackHandler(msg: any): Promise<void> {
    this.logger.log(
      `RabbitMQ -> Incoming Message on the feedback-${BWS_HOST_NAME} exchangeWithHost -> ${JSON.stringify(msg)}`
    );
    let presenceDeviceId: any;
    let presenceDeviceData: any;

    for ([presenceDeviceId, presenceDeviceData] of Object.entries(this.presenceDeviceService.presenceDevices)) {
      let process = false;
      let triggerDeviceId = presenceDeviceData.triggerDevice.split('/');
      triggerDeviceId = triggerDeviceId[triggerDeviceId.length - 1];

      if (msg.aId == presenceDeviceData.triggerDevice || msg.aId == triggerDeviceId) {
        process = true;
      }
      if (!process) {
        const listenerDeviceIds = Object.keys(presenceDeviceData.listenerDevices);
        let shortMsgAId = msg.aId.split('/').pop();
        if (listenerDeviceIds.includes(shortMsgAId || msg.aId)) {
          process = true;
        }
      }
      if (process) {
        console.log(`RabbitMQ -> Processing Message for ${presenceDeviceId}`);
        this.rabbitMQEvent.emit(`feedback-${BWS_HOST_NAME}` + '-sub', msg);
      }
    }
  }

  @RabbitSubscribe({
    exchange: `request-${BWS_HOST_NAME}`,
    queue: `request-${BWS_HOST_NAME}-${SERVICE_NAME}`,
    //This must be set to empty string
    routingKey: '',
    createQueueIfNotExists: true,
    queueOptions: {
      durable: true,
      autoDelete: false,
      messageTtl: 60000,
    },
  })
  public async requestHandler(msg: {}): Promise<void> {}

  sendFeedbackMsg(msg: {}): void {
    this.logger.log(
      `RabbitMQ -> Sending Message on the feedback-${BWS_HOST_NAME} exchangeWithHost -> ${JSON.stringify(msg)}`
    );
    this.amqpConnection.publish(`feedback-${BWS_HOST_NAME}`, '', msg);
  }
  sendRequestMsg(msg: any): void {
    this.logger.log(
      `RabbitMQ -> Sending Message on the request-${BWS_HOST_NAME} exchangeWithHost -> ${JSON.stringify(msg)}`
    );
    this.amqpConnection.publish(`request-${BWS_HOST_NAME}`, '', msg);
  }
}
