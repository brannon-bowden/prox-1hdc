import { Test, TestingModule } from '@nestjs/testing';
import { DatabaseFirebaseService } from './database-firebase.service';

describe('DatabaseFirebaseService', () => {
  let databaseFirebaseService: DatabaseFirebaseService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [DatabaseFirebaseService],
    }).compile();

    databaseFirebaseService = module.get<DatabaseFirebaseService>(DatabaseFirebaseService);
  });

  it('databaseFirebaseService should be defined', () => {
    expect(databaseFirebaseService).toBeDefined();
  });
});
