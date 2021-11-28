const mongoose = require("mongoose");
const { model, Schema } = mongoose;

const CommentSchema = new Schema(
  {
    sender: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "sender is required"],
      autopopulate: true,
    },
    task: {
      type: Schema.Types.ObjectId,
      ref: "Task",
      required: [true, "task is required"],
      //autopopulate: true,
    },
    content: {
      type: String,
      required: [true, "comment content is required"],
    },
  },
  { timestamps: true, id: false, toJSON: { virtuals: true } }
);

CommentSchema.plugin(require("mongoose-autopopulate"));
CommentSchema.plugin(require("mongoose-paginate-v2"));

module.exports = mongoose.model("Comment", CommentSchema, "comment");
