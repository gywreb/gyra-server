const mongoose = require("mongoose");
const { model, Schema } = mongoose;

const SprintSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, "sprint name is required"],
      trim: true,
      unique: true,
    },
    begin_date: {
      type: Date,
      required: [true, "sprint begin date is required"],
    },
    end_date: {
      type: Date,
      required: [true, "sprint end date is required"],
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
