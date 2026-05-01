import { Module } from '@nestjs/common';
import {
  HttpSemantleApiClient,
  SEMANTLE_API_CLIENT,
} from './semantle-api.client';
import { SemantleService } from './semantle.service';

@Module({
  providers: [
    SemantleService,
    HttpSemantleApiClient,
    {
      provide: SEMANTLE_API_CLIENT,
      useExisting: HttpSemantleApiClient,
    },
  ],
  exports: [SemantleService, SEMANTLE_API_CLIENT],
})
export class SemantleModule {}
