const mongoose = require("mongoose");
const { model, Schema } = mongoose;

const MEMBER_ROLES = ["leader", "developer", "tester", "product"];

const ProjectSchema = new Schema(
  {
    manager: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "project manager is required"],
      autopopulate: true,
    },
    name: {
      type: String,
      required: [true, "project name is required"],
      trim: true,
    },
    key: {
      type: String,
      required: [true, "project key is required"],
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
      required: [true, "project begin date is required"],
    },
    end_date: {
      type: Date,
      default: null,
    },
    members: [
      {
        _id: false,
        user: {
          type: Schema.Types.ObjectId,
          ref: "User",
          autopopulate: true,
        },
        role: {
          type: String,
          enum: MEMBER_ROLES,
          default: "developer",
        },
      },
    ],
    columns: {
      type: [
        {
          type: Schema.Types.ObjectId,
          ref: "Column",
          autopopulate: true,
        },
      ],
    },
    tasks: [
      {
        type: Schema.Types.ObjectId,
        ref: "Task",
        autopopulate: true,
      },
    ],
    activities: [
      {
        type: Schema.Types.ObjectId,
        ref: "Activity",
        autopopulate: true,
      },
    ],
    types: [
      {
        type: Schema.Types.ObjectId,
        ref: "Type",
        autopopulate: true,
      },
    ],
    releases: [
      {
        type: Schema.Types.ObjectId,
        ref: "Release",
        autopopulate: true,
      },
    ],
    sprints: [
      {
        type: Schema.Types.ObjectId,
        ref: "Sprint",
        autopopulate: true,
      },
    ],
  },
  { timestamps: true, id: false, toJSON: { virtuals: true } }
);

ProjectSchema.plugin(require("mongoose-autopopulate"));

module.exports = mongoose.model("Project", ProjectSchema, "project");
