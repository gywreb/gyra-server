const mongoose = require("mongoose");
const { model, Schema } = mongoose;

const ReleaseSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, "release name is required"],
    },
    version: {
      type: String,
      required: [true, "release version is required"],
      unique: true,
    },
    source: {
      type: String,
      default: null,
    },
    project: {
      type: Schema.Types.ObjectId,
      ref: "Project",
      required: [true, "project is required"],
      autopopulate: true,
    },
    tasks: [
      {
        type: Schema.Types.ObjectId,
        ref: "Task",
        //autopopulate: true,
      },
    ],
  },
  { timestamps: true, id: false, toJSON: { virtuals: true } }
);

ReleaseSchema.plugin(require("mongoose-autopopulate"));

module.exports = mongoose.model("Release", ReleaseSchema, "release");
