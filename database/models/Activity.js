import { model, Schema } from 'mongoose';

const ActivitySchema = new Schema(
  {
    content: {
      type: String,
      required: [true, 'activity content is required'],
    },
    creator: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'activity creator is required'],
    },
    target_user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    target_task: {
      type: Schema.Types.ObjectId,
      ref: 'Task',
      default: null,
    },
    project: {
      type: Schema.Types.ObjectId,
      ref: 'Project',
      required: [true, 'project is required'],
    },
  },
  { timestamps: true, id: false, toJSON: { virtuals: true } }
);

export default model('Activity', ActivitySchema, 'activity');
