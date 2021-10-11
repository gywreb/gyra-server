import { model, Schema } from 'mongoose';

const TypeSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, 'type name is required'],
      trim: true,
      unique: true,
    },
    color: {
      type: String,
      required: [true, 'type color is required'],
    },
    projects: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Project',
      },
    ],
  },
  { timestamps: true, id: false, toJSON: { virtuals: true } }
);

export default model('Type', TypeSchema, 'type');
