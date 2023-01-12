import { NestFactory } from '@nestjs/core';
import { VersioningType, Logger } from '@nestjs/common';
import { OccupancyModule } from './occupancy/occupancy.module';
import { EXPRESS_PORT } from './common/helpers/constants';

async function bootstrap() {
  let port = EXPRESS_PORT || 3000;
  let logger = new Logger('Main');
  const app = await NestFactory.create(OccupancyModule);
  app.enableVersioning({
    type: VersioningType.URI,
  });
  await app.listen(port);
  logger.log(`Listening on port ${port}`);
}
bootstrap();
