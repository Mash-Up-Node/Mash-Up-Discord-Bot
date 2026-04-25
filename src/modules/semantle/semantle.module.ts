import { Module } from '@nestjs/common';
import {
  HttpSemantleApiClient,
  SEMANTLE_API_CLIENT,
} from './semantle-api.client';

@Module({
  providers: [
    HttpSemantleApiClient,
    {
      provide: SEMANTLE_API_CLIENT,
      useExisting: HttpSemantleApiClient,
    },
  ],
  exports: [SEMANTLE_API_CLIENT],
})
export class SemantleModule {}
