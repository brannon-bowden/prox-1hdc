import { Injectable, Logger } from '@nestjs/common';
import { PresenceDevice } from './entities/presenceDevice.entity';
import { RabbitMqService } from '../rabbit-mq/rabbit-mq.service';
import { DatabaseFirebaseService } from 'src/database-firebase/database-firebase.service';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';

@Injectable()
export class PresenceDevicesService {
  constructor(
    private readonly databaseFirebaseService: DatabaseFirebaseService,
    private readonly rabbitMqService: RabbitMqService,
    private readonly eventEmitter: EventEmitter2
  ) {}
  public presenceDevices = {};
  private logger: Logger = new Logger(`PresenceDeviceService`);
  @OnEvent('presenceDevice.delete')
  async deletePresenceDevice(presenceDeviceId: string): Promise<void> {
    if (!!this.presenceDevices[presenceDeviceId]) {
      this.presenceDevices[presenceDeviceId].cleanup();
      delete this.presenceDevices[presenceDeviceId];
    }
  }

  async createOrUpdatePresenceDevices(domainDevicesData: any): Promise<void> {
    if (domainDevicesData?.presenceDevices) {
      for (const [presenceDeviceId, presenceDeviceData] of Object.entries(domainDevicesData?.presenceDevices)) {
        if (!!this.presenceDevices[presenceDeviceId]) {
          this.presenceDevices[presenceDeviceId].updatePresenceDevice(presenceDeviceData);
        } else {
          // this.logger.log(`Setting Up Presence Device ${presenceDeviceId} for Domain ${domainDevicesData.domainId}`);
          this.presenceDevices[presenceDeviceId] = new PresenceDevice(
            presenceDeviceId,
            domainDevicesData.domainId,
            presenceDeviceData,
            this.databaseFirebaseService,
            this.rabbitMqService,
            this.eventEmitter
          );
        }
      }
    }
  }
}
