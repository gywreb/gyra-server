const mongoose = require("mongoose");
const { model, Schema } = mongoose;

const ColumnSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, "column name is required"],
      trim: true,
    },
    archived: {
      type: Boolean,
      default: false,
    },
    project: {
      type: Schema.Types.ObjectId,
      ref: "Project",
      required: true,
      //autopopulate: true,
    },
  },
  { timestamps: true, id: false, toJSON: { virtuals: true } }
);

ColumnSchema.plugin(require("mongoose-autopopulate"));

module.exports = mongoose.model("Column", ColumnSchema, "column");
