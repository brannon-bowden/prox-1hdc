import { RabbitMqService } from 'src/rabbit-mq/rabbit-mq.service';
import { getDomainIdFromFireRef, getIdFromFireRef } from '../../common/helpers/fireBaseRefFunctions';
import { BWS_HOST_NAME } from '../../common/helpers/constants';
import { validMsg } from 'src/common/helpers/validMsg';
import { getDeviceKey } from 'src/common/helpers/getDeviceKey';
import { ignoreListenerFeedback, isValidTriggerFeedback } from 'src/common/helpers/ignoreFeedback';
import { Logger } from '@nestjs/common';
import { DatabaseFirebaseService } from 'src/database-firebase/database-firebase.service';
import { off } from 'process';
import { EventEmitter2 } from '@nestjs/event-emitter';
interface presenceDeviceDataInterface {
  levelUrl?: string;
  listenerDevices?: Array<any>;
  name?: string;
  occupied?: boolean;
  occupiedScene?: string;
  timer?: number;
  occupancyDelayTime?: number;
  occupancyCheckStateTime?: number;
  triggerDevice?: string;
  vacantScene?: string;
  timeToChange?: number;
  grandWelcomeScene?: string;
}
export class PresenceDevice {
  constructor(
    private readonly presenceDeviceId: string,
    private readonly domainId: string,
    private readonly data: presenceDeviceDataInterface,
    private readonly databaseService: DatabaseFirebaseService,
    private readonly rabbitMqService: RabbitMqService,
    private readonly eventEmitter: EventEmitter2
  ) {
    this.logger = new Logger(PresenceDevice.name);
    if (!!presenceDeviceId) {
      this.presenceDeviceRef = `/domains/${this.domainId}/presenceDevices/${this.presenceDeviceId}`;
    }
    if (!!data.levelUrl) this.levelUrl = data.levelUrl;
    if (!!data.name) this.name = this.data.name;
    if (!!data.listenerDevices) this.listenerDevices = this.data.listenerDevices;
    if (!!data.occupiedScene) this.occupiedScene = this.data.occupiedScene;
    if (!!data.triggerDevice) this.triggerDevice = this.data.triggerDevice;
    if (!!data.occupied) this.occupied = this.data.occupied;
    if (!!data.vacantScene) this.vacantScene = this.data.vacantScene;
    if (!!data.timeToChange) this.timeToChange = this.data.timeToChange;
    if (!!data.timer && !data.occupancyDelayTime) this.occupancyDelayTime = this.data.timer;
    if (!!data.occupancyDelayTime) this.occupancyDelayTime = this.data.occupancyDelayTime;
    if (!!data.occupancyCheckStateTime) this.occupancyCheckStateTime = this.data.occupancyCheckStateTime;
    if (!!data.grandWelcomeScene) this.grandWelcomeScene = this.data.grandWelcomeScene;

    this.rabbitMqService.rabbitMQEvent.on(`feedback-${BWS_HOST_NAME}-sub`, this.handleRabbitMQFeedbackSub.bind(this));
  }
  private logger: Logger;
  private name: string = '';
  private listenerDevices: Array<any> = [];
  private grandWelcomeScene: string;
  private occupiedScene: string;
  private occupancyDelayTime: number = 30;
  private occupancyCheckStateTime: number = 10;
  private triggerDevice: string = '';
  private occupied: Boolean = false;
  private vacantScene: string;
  private timeToChange: number = 0;
  private presenceDeviceRef: string = '';
  private occupancyCheckStateTimer: any;
  private occupancyDelayTimer: any;
  private triggerDeviceLastState: Boolean = undefined;
  private levelUrl: string;

  async handleRabbitMQFeedbackSub(msg: any): Promise<void> {
    await this.handleTriggerLogic(msg);
    await this.handleListenerLogic(msg);
  }

  async handleTriggerLogic(msg: any) {
    this.logger.log(`Handling Trigger Logic Raw ${msg.aId} ${this.triggerDevice}`);
    if (getIdFromFireRef(this.triggerDevice) === msg.aId || this.triggerDevice === msg.aId) {
      this.logger.log(`Handling Trigger Logic`);
      try {
        let deviceKey = getDeviceKey(msg);
        if (!isValidTriggerFeedback(deviceKey, msg[deviceKey])) {
          return;
        }
        this.logger.log(`Handling Trigger Logic 1`);
        const presenceDeviceData = await this.databaseService.fbFetch(this.presenceDeviceRef);
        if (!presenceDeviceData) {
          this.eventEmitter.emit('presenceDevice.delete', this.presenceDeviceId);
          return;
        }
        this.logger.log(`Handling Trigger Logic 2`);
        this.logger.log(`Received a Trigger Message`);
        if (this.triggerDeviceLastState === msg[deviceKey]) return; //Only handle state changes
        this.triggerDeviceLastState = msg[deviceKey];
        if (!this.occupied) {
          this.logger.log(`Current State of the system is Vacant`);
          if (!msg[deviceKey]) return; //Only handle Door Open Events
          this.occupied = true;
          await this.sendSceneToRabbit(await this.occupiedSceneToSend());
          await this.updateOccupancyState();
        } else {
          this.logger.log(`Current State of the system is Occupied`);
          !!this.occupancyCheckStateTimer && clearTimeout(this.occupancyCheckStateTimer);
          !!this.occupancyDelayTimer && clearTimeout(this.occupancyDelayTimer);
          if (msg[deviceKey]) return; //Only handle Door Close Events
          //Check if either timer is running and if so, clear it
          this.logger.log(`About to Set Timers - ${this.occupancyCheckStateTime} - ${this.occupancyDelayTime}`);
          this.occupancyCheckStateTimer = setTimeout(async () => {
            this.logger.log(`Occupancy Check State Timer has expired`);
            for (const [assetId, assetRef] of Object.entries(this.listenerDevices)) {
              this.logger.log(`Checking if any assets are occupied`);
              let assetData = await this.databaseService.fbFetch(assetRef);
              console.log(assetData);
              switch (assetData?.type) {
                case 'occupancy':
                  if (assetData?.res?.occFb == true) {
                    this.logger.log(`Asset is occupied so don't mark vacant`);
                    !!this.occupancyDelayTimer && clearTimeout(this.occupancyDelayTimer);
                    return;
                  }
              }
            }
          }, 60000 * this.occupancyCheckStateTime);
          this.occupancyDelayTimer = setTimeout(async () => {
            this.logger.log(`Occupancy Delay Timer has expired`);
            this.occupied = false;
            await this.sendSceneToRabbit(this.vacantScene);
            await this.updateOccupancyState();
          }, 60000 * this.occupancyDelayTime);
        }
      } catch (e) {
        this.logger.error(e);
      }
    }
  }

  async handleListenerLogic(msg: any) {
    if (!!this.occupied && this.occupancyDelayTimer) {
      Object.values(this.listenerDevices).forEach(async deviceId => {
        if (deviceId === msg.aId) {
          this.logger.log(`Handling Listener Logic`);
          try {
            if (!msg.dId && msg.aId && typeof msg.aId === 'string') msg.dId = getDomainIdFromFireRef(msg.aId);
            if (!validMsg(msg)) return this.logger.log('Invalid msg'); // Exiting: Invalid msg
            let deviceKey = getDeviceKey(msg);
            if (ignoreListenerFeedback(deviceKey, msg[deviceKey])) return;
            if (msg[deviceKey]) {
              this.logger.log(`Got a listener feedback that is true during occupancy so clearing timers`);
              !!this.occupancyCheckStateTimer && clearTimeout(this.occupancyCheckStateTimer);
              !!this.occupancyDelayTimer && clearTimeout(this.occupancyDelayTimer);
            }
          } catch (e) {
            this.logger.error(e);
          }
        }
      });
    }
  }

  async updateOccupancyState() {
    this.rabbitMqService.sendFeedbackMsg({
      aId: this.presenceDeviceRef,
      dId: this.domainId,
      occFb: this.occupied,
      ts: Date.now(),
    });
    await this.databaseService.updateOccupancyState(this.presenceDeviceRef, this.occupied, err => {
      if (err) throw err;
    });
  }

  async sendSceneToRabbit(scene: string) {
    if (scene) {
      const actionMsg = {
        domainId: this.domainId,
        path: scene,
        type: 'scene',
        action: 'request',
      };
      this.rabbitMqService.sendRequestMsg(actionMsg);
    }
  }

  async occupiedSceneToSend() {
    if (!this.grandWelcomeScene || !this.levelUrl) return this.occupiedScene;
    const grandWelcomeSceneTriggered = await this.databaseService.fbFetch(
      `${this.levelUrl}/grandWelcomeSceneTriggered`
    );
    if (grandWelcomeSceneTriggered) return this.occupiedScene;
    await this.databaseService.fbUpdate(`${this.levelUrl}`, { grandWelcomeSceneTriggered: true });
    return this.grandWelcomeScene;
  }

  updatePresenceDevice(data: presenceDeviceDataInterface) {
    if (!!this.presenceDeviceId)
      this.presenceDeviceRef = `/domains/${this.domainId}/presenceDevices/${this.presenceDeviceId}`;
    if (!!data.name) this.name = data.name;
    if (!!data.listenerDevices) this.listenerDevices = data.listenerDevices;
    if (!!data.occupiedScene) this.occupiedScene = data.occupiedScene;
    if (!!data.timer) this.occupancyDelayTime = data.timer;
    if (!!data.triggerDevice) this.triggerDevice = data.triggerDevice;
    this.occupied = data.occupied;
    if (!!data.vacantScene) this.vacantScene = data.vacantScene;
    if (!!data.timeToChange) this.timeToChange = data.timeToChange;
  }

  async cleanup() {
    this.logger.log(`Cleaning up Presence Device ${this.presenceDeviceId}`);
    !!this.occupancyCheckStateTimer && clearTimeout(this.occupancyCheckStateTimer);
    !!this.occupancyDelayTimer && clearTimeout(this.occupancyDelayTimer);
  }
}
