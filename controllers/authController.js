import User from '../database/models/User';
import { asyncMiddleware } from '../middlewares/asyncMiddleware';
import { ErrorResponse } from '../models/ErrorResponse';
import { SuccessResponse } from '../models/SuccessResponse';
import bcrypt from 'bcryptjs';
import { omit } from 'lodash';

const register = asyncMiddleware(async (req, res, next) => {
  const { username, email, password } = req.body;
  const user = new User({
    username,
    email,
    password,
  });
  const newUser = await user.save();
  res.status(201).json(new SuccessResponse(201, { newUser }));
});

const login = asyncMiddleware(async (req, res, next) => {
  const { username, email, password } = req.body;

  const user =
    (await User.findOne({ username })) ||
    (await User.findOne({ email: username }));

  if (!user) {
    return next(new ErrorResponse(400, `${username || email} is not exist`));
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) return next(new ErrorResponse(400, 'incorrect password'));
  const payload = omit(user._doc, 'password', '__v');
  const token = User.genJwt(payload);
  const options = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRE * 24 * 60 * 60 * 1000
    ),
    httpOnly: 'true',
    secure: process.env.NODE_ENV === 'development' ? false : true,
  };
  res
    .cookie('token', token, options)
    .json(new SuccessResponse(200, { token, userInfo: payload }));
});

const getCurrent = asyncMiddleware(async (req, res, next) => {
  const authUser = req.user._doc;
  if (!authUser) return next(new ErrorResponse(401, 'unauthorized'));
  const userInfo = omit(authUser, 'password', '__v');
  res.json(new SuccessResponse(200, { userInfo }));
});

export default { register, login, getCurrent };
