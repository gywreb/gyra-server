const mongoose = require("mongoose");
const { model, Schema } = mongoose;

const UserStorySchema = new Schema(
  {
    content: {
      type: String,
      required: [true, "user story content is required"],
      trim: true,
    },
    description: {
      type: String,
      default: null,
    },
    key: {
      type: String,
      required: [true, "user story key is required"],
      trim: true,
    },
    tasks: [
      {
        type: Schema.Types.ObjectId,
        ref: "Task",
        required: true,
      },
    ],
    project: {
      type: Schema.Types.ObjectId,
      ref: "Project",
      required: true,
      //autopopulate: true,
    },
    isComplete: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true, id: false, toJSON: { virtuals: true } }
);

UserStorySchema.plugin(require("mongoose-autopopulate"));

module.exports = mongoose.model("UserStory", UserStorySchema, "user-story");
