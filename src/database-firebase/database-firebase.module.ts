import { CacheModule, Module } from '@nestjs/common';
import { DatabaseFirebaseService } from './database-firebase.service';

@Module({
  imports: [CacheModule.register()],
  controllers: [],
  providers: [DatabaseFirebaseService],
  exports: [DatabaseFirebaseService],
})
export class DatabaseFirebaseModule {}
