const mongoose = require("mongoose");
const { model, Schema } = mongoose;

const PRIORITY = ["highest", "high", "medium", "low", "lowest"];

const TaskSchema = new Schema(
  {
    task_key: {
      type: String,
      required: [true, "task key is required"],
      unique: true,
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
      autopopulate: true,
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
      autopopulate: true,
    },
    type: {
      type: Schema.Types.ObjectId,
      ref: "Type",
      required: [true, "task type is required"],
      autopopulate: true,
    },
    comments: [
      {
        type: Schema.Types.ObjectId,
        ref: "Comment",
        autopopulate: true,
      },
    ],
    attachments: [
      {
        type: Schema.Types.ObjectId,
        ref: "Attachment",
        autopopulate: true,
      },
    ],
    release: {
      type: Schema.Types.ObjectId,
      ref: "Release",
      default: null,
      autopopulate: true,
    },
  },
  { timestamps: true, id: false, toJSON: { virtuals: true } }
);

TaskSchema.plugin(require("mongoose-autopopulate"));

module.exports = mongoose.model("Task", TaskSchema, "task");
