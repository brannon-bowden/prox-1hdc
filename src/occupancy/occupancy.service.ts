import { Injectable, OnModuleInit } from '@nestjs/common';
import { PresenceDevicesService } from 'src/presenceDevices/presenceDevice.service';
import { RabbitMqService } from 'src/rabbit-mq/rabbit-mq.service';
import { EventEmitter } from 'events';
import { DatabaseFirebaseService } from 'src/database-firebase/database-firebase.service';
import { Logger } from '@nestjs/common';

@Injectable()
export class OccupancyService implements OnModuleInit {
  async onModuleInit() {
    this.processDomainPresenceDevices();
    setInterval(async () => {
      this.processDomainPresenceDevices();
    }, 60000);
  }

  constructor(
    private readonly rabbitMqService: RabbitMqService,
    private readonly databaseFirebaseService: DatabaseFirebaseService,
    private readonly presenceDevicesService: PresenceDevicesService
  ) {}
  private logger: Logger = new Logger(`OccupancyService`);
  rabbitMQEvent: EventEmitter;

  async processDomainPresenceDevices() {
    const presenceDeviceData = await this.databaseFirebaseService.getPresenceDevices();

    for (const domainPresenceDevices of presenceDeviceData) {
      //this.logger.log(`Getting Presence Devices`);
      this.presenceDevicesService.createOrUpdatePresenceDevices(domainPresenceDevices);
    }
  }
}
