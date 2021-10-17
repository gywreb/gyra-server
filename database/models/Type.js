const mongoose = require("mongoose");
const { model, Schema } = mongoose;

const TypeSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, "type name is required"],
      trim: true,
      unique: true,
    },
    color: {
      type: String,
      required: [true, "type color is required"],
    },
    owner: {
      type: Schema.Types.ObjectId,
      ref: "User",
      autopopulate: true,
    },
    projects: [
      {
        type: Schema.Types.ObjectId,
        ref: "Project",
        autopopulate: true,
      },
    ],
  },
  { timestamps: true, id: false, toJSON: { virtuals: true } }
);

TypeSchema.plugin(require("mongoose-autopopulate"));

module.exports = mongoose.model("Type", TypeSchema, "type");
