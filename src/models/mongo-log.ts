import { Schema, model, InferSchemaType } from 'mongoose';

const webhookLogSchema = new Schema(
  {
    monobankData: {
      type: Schema.Types.Mixed,
      required: true,
    },
    endpoint: {
      type: String,
      default: '/unknown',
    },
    processed: {
      type: Boolean,
      default: false,
    },
    errorMessage: {
      type: String,
    },
  },
  {
    timestamps: { createdAt: 'receivedAt', updatedAt: false },
    versionKey: false,
  },
);

export type WebhookLogType = InferSchemaType<typeof webhookLogSchema>;

const WebhookLog = model<WebhookLogType>('WebhookLog', webhookLogSchema);

export default WebhookLog;
