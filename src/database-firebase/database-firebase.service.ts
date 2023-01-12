import { Injectable, Inject, OnModuleInit, CACHE_MANAGER, Logger } from '@nestjs/common';
import { Cache } from 'cache-manager';
import * as fbAdmin from 'firebase-admin';
import { getIdFromFireRef } from 'src/common/helpers/fireBaseRefFunctions';
const { BWS_HOST_NAME } = require('../common/helpers/constants');
import { credential, databaseURL } from './config/firebaseConfig';

@Injectable()
export class DatabaseFirebaseService implements OnModuleInit {
  private logger: Logger;
  onModuleInit() {
    fbAdmin.initializeApp({ credential, databaseURL });
  }
  constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {
    this.logger = new Logger(DatabaseFirebaseService.name);
  }

  async fbFetch(url) {
    if (!url) return;
    let result = await fbAdmin
      .database()
      .ref(url)
      .once('value')
      .then(this.returnSnapshotValue)
      .catch(err => {
        this.logger.error(err);
        return undefined;
      });
    return result;
  }
  returnSnapshotValue(snapshot) {
    return snapshot.val();
  }

  async getPresenceDevices() {
    try {
      const firebaseData = await this.fbFetch('/domains/');
      const returnData = [];

      let domainId: any;
      let domainData: any;

      for ([domainId, domainData] of Object.entries(firebaseData)) {
        returnData.push({
          domainId,
          presenceDevices: domainData?.presenceDevices,
        });
      }

      return await returnData;
    } catch (err) {
      this.logger.error(err);
    }
  }

  async checkOccupancySensors(presenceDevice): Promise<any> {
    let occupancySensors = {};
    let sensorsOccupied = false;
    this.logger.log(`In Check Occupancy Sensors for ${JSON.stringify(presenceDevice.name)}`);
    await Promise.all(
      Object.values(presenceDevice.listenerDevices || {}).map(async (deviceRef: any) => {
        if (!deviceRef) return;
        if (typeof deviceRef != 'string') return;
        this.logger.log(`deviceRef = ${deviceRef}`);
        let device = (await this.fbFetch(deviceRef)) || {};
        device.id = getIdFromFireRef(deviceRef);
        device.ref = deviceRef;
        if (device.type === 'occupancy') occupancySensors[device.id] = device;
      })
    )
      .then(() => {
        this.logger.log('Checking occupancy sensors...');
        this.logger.log(Object.keys(occupancySensors));
        Object.values(occupancySensors).forEach((occupancySensor: any = {}) => {
          if (occupancySensor.res && occupancySensor.res.occFb) sensorsOccupied = true;
        });
        this.logger.log('sensorsOccupied', sensorsOccupied);
        return sensorsOccupied;
      })
      .catch(err => {
        this.logger.error(err);
      });
  }

  async fbUpdate(assetRef, value) {
    try {
      await fbAdmin.database().ref(assetRef).update(value);
    } catch (error) {
      this.logger.error(error);
    }
  }

  async updateOccupancyState(assetRef, value, err) {
    try {
      await fbAdmin.database().ref(assetRef).update({ occupied: value });
    } catch (error) {
      this.logger.error(error);
    }
  }

  async updateTimeToChangeState(assetRef, value, err) {
    this.logger.log('in updateTimeToChangeState', assetRef, value);
    try {
      await fbAdmin.database().ref(assetRef).update({ timeToChange: value });
    } catch (error) {
      this.logger.error(error);
    }
  }
}
