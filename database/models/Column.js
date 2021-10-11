import { model, Schema } from 'mongoose';

const ColumnSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, 'column name is required'],
      trim: true,
      unique: true,
    },
    index: {
      type: Number,
      required: [true, 'column index is required'],
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

export default model('Column', ColumnSchema, 'column');
