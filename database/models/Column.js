const mongoose = require("mongoose");
const { model, Schema } = mongoose;

const ColumnSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, "column name is required"],
      trim: true,
      unique: true,
    },
    index: {
      type: Number,
      required: [true, "column index is required"],
    },
    archived: {
      type: Boolean,
      default: false,
    },
    project: {
      type: Schema.Types.ObjectId,
      ref: "Project",
      autopopulate: true,
    },
  },
  { timestamps: true, id: false, toJSON: { virtuals: true } }
);

ColumnSchema.plugin(require("mongoose-autopopulate"));

module.exports = mongoose.model("Column", ColumnSchema, "column");
