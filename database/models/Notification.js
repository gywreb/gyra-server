const mongoose = require("mongoose");
const { model, Schema } = mongoose;

const NotificationSchema = new Schema(
  {
    sender: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "sender is required"],
      autopopulate: true,
    },
    content: {
      type: String,
      required: [true, "notification content is required"],
    },
    seen: {
      type: Boolean,
      default: false,
    },
    owner: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "owner is required"],
      autopopulate: true,
    },
  },
  { timestamps: true, id: false, toJSON: { virtuals: true } }
);

NotificationSchema.plugin(require("mongoose-autopopulate"));
NotificationSchema.plugin(require("mongoose-paginate-v2"));

module.exports = mongoose.model(
  "Notification",
  NotificationSchema,
  "notification"
);
