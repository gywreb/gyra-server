const mongoose = require("mongoose");
const { Schema } = mongoose;

const SubTaskSchema = new Schema(
  {
    content: {
      type: String,
      required: ["subtask content is required"],
    },
    isDone: {
      type: Boolean,
      default: false,
    },
    task: {
      type: Schema.Types.ObjectId,
      ref: "Task",
    },
  },
  { timestamps: true, id: false, toJSON: { virtuals: true } }
);

SubTaskSchema.plugin(require("mongoose-autopopulate"));

module.exports = mongoose.model("SubTask", SubTaskSchema, "subtask");
