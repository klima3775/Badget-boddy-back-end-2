import { Schema, model, InferSchemaType } from 'mongoose';

const transactionSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    account: {
      type: String,
      required: true,
    },

    monobankId: {
      type: String,
      required: true,
      unique: true,
    },

    time: {
      type: Number,
      required: true,
    },

    amount: {
      type: Number,
      required: true,
    },

    description: {
      type: String,
      default: '',
    },

    mcc: {
      type: Number,
      required: true,
    },
    currencyCode: {
      type: Number,
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

export type TransactionType = InferSchemaType<typeof transactionSchema>;

const Transaction = model<TransactionType>('Transaction', transactionSchema);

export default Transaction;
