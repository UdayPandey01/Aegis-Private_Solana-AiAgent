import { Module } from '@nestjs/common';
import { PriceLoggerService } from './price-logger.service';

@Module({
    providers: [PriceLoggerService],
    exports: [PriceLoggerService],
})
export class PriceModule { }
