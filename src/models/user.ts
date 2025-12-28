import { Schema, model, InferSchemaType } from 'mongoose';

const userSchema = new Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    monobankToken: {
      type: String,
      required: true,
      select: false,
    },
  },
  {
    timestamps: true,
  },
);

export type UserType = InferSchemaType<typeof userSchema>;

const User = model<UserType>('User', userSchema);

export default User;
