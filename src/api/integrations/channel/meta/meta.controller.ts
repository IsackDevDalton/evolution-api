import { PrismaRepository } from '@api/repository/repository.service';
import { WAMonitoringService } from '@api/services/monitor.service';
import { Logger } from '@config/logger.config';
import axios from 'axios';

import { ChannelController, ChannelControllerInterface } from '../channel.controller';

export class MetaController extends ChannelController implements ChannelControllerInterface {
  private readonly logger = new Logger('MetaController');

  constructor(prismaRepository: PrismaRepository, waMonitor: WAMonitoringService) {
    super(prismaRepository, waMonitor);
  }

  integrationEnabled: boolean;

  public async receiveWebhook(data: any) {
    if (data.object === 'whatsapp_business_account') {
      if (data.entry[0]?.changes[0]?.field === 'message_template_status_update') {
        setImmediate(async () => {
          try {
            const template = await this.prismaRepository.template.findFirst({
              where: { templateId: `${data.entry[0].changes[0].value.message_template_id}` },
            });

            if (!template) {
              this.logger.warn('Template not found for status update');
              return;
            }

            const { webhookUrl } = template;

            await axios.post(webhookUrl, data.entry[0].changes[0].value, {
              headers: {
                'Content-Type': 'application/json',
              },
            });
          } catch (err) {
            this.logger.error(['TemplateWebhookError', err?.message]);
          }
        });

        return { status: 'success' };
      }

      data.entry?.forEach((entry: any) => {
        const numberId = entry.changes[0]?.value?.metadata?.phone_number_id;

        if (!numberId) {
          this.logger.error('WebhookService -> receiveWebhookMeta -> numberId not found');
          return;
        }

        // Desacople asíncrono: se ejecuta inmediatamente en segundo plano sin bloquear la respuesta a Meta
        setImmediate(async () => {
          try {
            const instance = await this.prismaRepository.instance.findFirst({
              where: { number: numberId },
            });

            if (!instance) {
              this.logger.error(`WebhookService -> receiveWebhookMeta -> instance not found for number ${numberId}`);
              return;
            }

            if (this.waMonitor.waInstances[instance.name]) {
              await this.waMonitor.waInstances[instance.name].connectToWhatsapp(data);
            } else {
              this.logger.error(`WebhookService -> receiveWebhookMeta -> instance ${instance.name} not in waInstances`);
            }
          } catch (error) {
            this.logger.error(['AsyncMetaWebhookError', error]);
          }
        });
      });
    }

    return {
      status: 'success',
    };
  }
}
