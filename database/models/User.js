import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const Schema = mongoose.Schema;

const UserSchema = new Schema(
  {
    username: {
      type: String,
      required: [true, 'username is required'],
      minlength: [4, 'username must be atleast 4 characters'],
      unique: true,
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'email is required'],
      match: [/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/g, 'Invalid email!'],
      unique: true,
      trim: true,
    },
    password: {
      type: String,
      minlength: [6, 'password must be atleast 6 characters'],
      required: [true, 'password is required'],
      trim: true,
    },
    fullname: {
      type: String,
      default: null,
    },
    avatar: {
      type: String,
      default: null,
    },
    tasks: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Task',
      },
    ],
    projects: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Project',
      },
    ],
    people: [
      {
        type: Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    pendingUser: [
      {
        type: Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    notifications: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Activity',
      },
    ],
  },
  { timestamps: true, id: false, toJSON: { virtuals: true } }
);

UserSchema.pre('save', async function (next) {
  const user = this;
  // if not update password ==> not encrypt
  if (!user.isModified('password')) next();
  try {
    const salt = await bcrypt.genSalt();
    user.password = await bcrypt.hash(user.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

UserSchema.statics.genJwt = function (payload) {
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE,
  });
};

export default mongoose.model('User', UserSchema, 'user');
