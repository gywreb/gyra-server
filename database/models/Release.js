import { model, Schema } from 'mongoose';

const ReleaseSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, 'release name is required'],
    },
    version: {
      type: String,
      required: [true, 'release version is required'],
      unique: true,
    },
    source: {
      type: String,
      default: null,
    },
    project: {
      type: Schema.Types.ObjectId,
      ref: 'Project',
      required: [true, 'project is required'],
    },
    tasks: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Task',
      },
    ],
  },
  { timestamps: true, id: false, toJSON: { virtuals: true } }
);

export default model('Release', ReleaseSchema, 'release');
