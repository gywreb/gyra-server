import { model, Schema } from 'mongoose';

const CommentSchema = new Schema(
  {
    sender: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'sender is required'],
    },
    task: {
      type: Schema.Types.ObjectId,
      ref: 'Task',
      required: [true, 'task is required'],
    },
    content: {
      type: String,
      required: [true, 'comment content is required'],
    },
  },
  { timestamps: true, id: false, toJSON: { virtuals: true } }
);

export default model('Comment', CommentSchema, 'comment');
