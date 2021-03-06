const mongoose = require("mongoose");
const { model, Schema } = mongoose;

const SprintSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, "sprint name is required"],
      trim: true,
    },
    begin_date: {
      type: Date,
      required: [true, "sprint begin date is required"],
    },
    duration: {
      type: Number,
      required: [true, "sprint duration is required"]
    },
    maxEst: {
      type: Number,
      default: null,
    },
    description: {
      type: String,
      default: null,
    },
    project: {
      type: Schema.Types.ObjectId,
      ref: "Project",
      required: [true, "project id is required"],
      //autopopulate: true,
    },
  },
  { timestamps: true, id: false, toJSON: { virtuals: true } }
);

SprintSchema.plugin(require("mongoose-autopopulate"));

module.exports = mongoose.model("Sprint", SprintSchema, "sprint");
