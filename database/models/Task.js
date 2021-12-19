const mongoose = require("mongoose");
const { PRIORITY, TASK_TYPES } = require("../../configs/constants");
const { model, Schema } = mongoose;

const TaskSchema = new Schema(
  {
    task_key: {
      type: String,
      required: [true, "task key is required"],
      // unique: true,
      trim: true,
    },
    name: {
      type: String,
      required: [true, "task name is required"],
      trim: true,
    },
    description: {
      type: String,
      default: null,
    },
    priority: {
      type: String,
      enum: PRIORITY,
      required: [true, "task priority is required"],
    },
    assignee: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
      autopopulate: true,
    },
    reporter: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "task reporter is required"],
      autopopulate: true,
    },
    project: {
      type: Schema.Types.ObjectId,
      ref: "Project",
      required: [true, "project id required"],
      //autopopulate: true,
    },
    status: {
      type: Schema.Types.ObjectId,
      ref: "Column",
      default: null,
      autopopulate: true,
    },
    sprint: {
      type: Schema.Types.ObjectId,
      ref: "Sprint",
      default: null,
      //autopopulate: true,
    },
    type: {
      type: String,
      enum: TASK_TYPES,
      required: [true, "task type is required"],
    },
    comments: [
      {
        type: Schema.Types.ObjectId,
        ref: "Comment",
        //autopopulate: true,
      },
    ],
    attachments: [
      {
        type: Schema.Types.ObjectId,
        ref: "Attachment",
        //autopopulate: true,
      },
    ],
    release: {
      type: Schema.Types.ObjectId,
      ref: "Release",
      default: null,
      //autopopulate: true,
    },
    subtasks: [
      {
        id: {
          type: Number,
          required: ["subtask id is required"],
        },
        content: {
          type: String,
          required: ["subtask content is required"],
        },
        isDone: {
          type: Boolean,
          default: false,
        },
      },
    ],
    isDone: {
      type: Boolean,
      default: false,
    },
    isResolve: {
      type: Boolean,
      default: false,
    },
    isClose: {
      type: Boolean,
      default: false,
    },
    isWorking: {
      type: Boolean,
      default: true,
    },
    userStory: {
      type: Schema.Types.ObjectId,
      ref: "UserStory",
      required: [true, "user story is required"],
      autopopulate: true,
    },
  },
  { timestamps: true, id: false, toJSON: { virtuals: true } }
);

TaskSchema.plugin(require("mongoose-autopopulate"));

module.exports = mongoose.model("Task", TaskSchema, "task");
