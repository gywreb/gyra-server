import { model, Schema } from 'mongoose';

const PRIORITY = ['highest', 'high', 'medium', 'low', 'lowest'];

const TaskSchema = new Schema(
  {
    task_key: {
      type: String,
      required: [true, 'task key is required'],
      unique: true,
      trim: true,
    },
    name: {
      type: String,
      required: [true, 'task name is required'],
      trim: true,
    },
    description: {
      type: String,
      default: null,
    },
    priority: {
      type: String,
      enum: PRIORITY,
      required: [true, 'task priority is required'],
    },
    assignee: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    reporter: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'task reporter is required'],
    },
    project: {
      type: Schema.Types.ObjectId,
      ref: 'Project',
      required: [true, 'project id required'],
    },
    status: {
      type: Schema.Types.ObjectId,
      ref: 'Column',
      default: null,
    },
    sprint: {
      type: Schema.Types.ObjectId,
      ref: 'Sprint',
      default: null,
    },
    type: {
      type: Schema.Types.ObjectId,
      ref: 'Type',
      required: [true, 'task type is required'],
    },
    comments: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Comment',
      },
    ],
    attachments: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Attachment',
      },
    ],
    release: {
      type: Schema.Types.ObjectId,
      ref: 'Release',
      default: null,
    },
  },
  { timestamps: true, id: false, toJSON: { virtuals: true } }
);

export default model('Task', TaskSchema, 'task');
