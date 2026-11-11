import { Global, Module } from '@nestjs/common';
import { UtilityService } from './utils/utils.service.js';

@Global()
@Module({
    providers: [UtilityService],
    exports: [UtilityService]
})
export class SharedModule { }
