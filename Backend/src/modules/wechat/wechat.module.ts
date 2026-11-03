import { Logger, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CommunityModule } from '../community/community.module';
import { LiveWechatApi, MockWechatApi } from './wechat.api';
import { WechatSimulatorController } from './wechat-simulator.controller';
import { WechatController } from './wechat.controller';
import { WECHAT_ENTITIES } from './wechat.entities';
import { WECHAT_API, WechatService } from './wechat.service';

/**
 * Messagerie QIAO via le compte officiel WeChat (compte de service vérifié).
 * Réel si WECHAT_OA_APP_ID, WECHAT_OA_APP_SECRET et WECHAT_OA_TOKEN sont renseignés ; sinon simulateur hors production
 * (WECHAT_OA_MOCK=false pour le désactiver) ; en production sans compte configuré, la fonction est désactivée.
 */
@Module({
  imports: [TypeOrmModule.forFeature(WECHAT_ENTITIES), CommunityModule],
  controllers: [WechatController, WechatSimulatorController],
  providers: [
    WechatService,
    LiveWechatApi,
    MockWechatApi,
    {
      provide: WECHAT_API,
      inject: [ConfigService, LiveWechatApi, MockWechatApi],
      useFactory: (config: ConfigService, live: LiveWechatApi, mock: MockWechatApi) => {
        const logger = new Logger('Wechat');
        const configured = ['WECHAT_OA_APP_ID', 'WECHAT_OA_APP_SECRET', 'WECHAT_OA_TOKEN'].every((key) => !!config.get<string>(key));
        if (configured) {
          logger.log('Messagerie WeChat : compte officiel QIAO configuré.');
          return live;
        }
        if (config.get<string>('NODE_ENV') !== 'production' && config.get<string>('WECHAT_OA_MOCK') !== 'false') {
          logger.log('Messagerie WeChat : simulateur (/api/wechat/simulator) — aucun message réel.');
          return mock;
        }
        logger.warn('Messagerie WeChat désactivée : compte officiel non configuré.');
        return null;
      },
    },
  ],
})
export class WechatModule {}
