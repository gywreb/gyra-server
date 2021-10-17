const mongoose = require("mongoose");
const { model, Schema } = mongoose;

const ActivitySchema = new Schema(
  {
    content: {
      type: String,
      required: [true, "activity content is required"],
    },
    creator: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "activity creator is required"],
      autopopulate: true,
    },
    target_user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
      autopopulate: true,
    },
    target_task: {
      type: Schema.Types.ObjectId,
      ref: "Task",
      default: null,
      autopopulate: true,
    },
    project: {
      type: Schema.Types.ObjectId,
      ref: "Project",
      required: [true, "project is required"],
      autopopulate: true,
    },
  },
  { timestamps: true, id: false, toJSON: { virtuals: true } }
);

ActivitySchema.plugin(require("mongoose-autopopulate"));

module.exports = model("Activity", ActivitySchema, "activity");
