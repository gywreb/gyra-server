import { model, Schema } from 'mongoose';

const ProjectSchema = new Schema(
  {
    manager: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'project manager is required'],
    },
    name: {
      type: String,
      required: [true, 'project name is required'],
      trim: true,
      unique: true,
    },
    key: {
      type: String,
      required: [true, 'project key is required'],
      unique: true,
    },
    avatar: {
      type: String,
      default: null,
    },
    description: {
      type: String,
      default: null,
    },
    duration: {
      type: Number,
      default: null,
    },
    begin_date: {
      type: Date,
      required: [true, 'project begin date is required'],
    },
    end_date: {
      type: Date,
      default: null,
    },
    members: [
      {
        type: Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    columns: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Column',
      },
    ],
    tasks: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Task',
      },
    ],
    activities: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Activity',
      },
    ],
    types: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Type',
      },
    ],
    releases: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Release',
      },
    ],
    sprints: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Sprint',
      },
    ],
  },
  { timestamps: true, id: false, toJSON: { virtuals: true } }
);
export default model('Project', ProjectSchema, 'project');
