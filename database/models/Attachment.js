const mongoose = require("mongoose");
const { ATTACHMENT_TYPE } = require("../../configs/constants");
const { model, Schema } = mongoose;

const AttachmentSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, "attachment name is required"],
    },
    type: {
      type: String,
      enum: ATTACHMENT_TYPE,
      required: [true, "attachment type is required"],
    },
    size: {
      type: Number,
      required: [true, "attachment size is required"],
    },
    task: {
      type: Schema.Types.ObjectId,
      ref: "Task",
      default: null,
      //autopopulate: true,
    },
  },
  { timestamps: true, id: false, toJSON: { virtuals: true } }
);

AttachmentSchema.plugin(require("mongoose-autopopulate"));

module.exports = mongoose.model("Attachment", AttachmentSchema, "attachment");
