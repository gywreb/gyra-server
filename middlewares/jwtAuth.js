import User from '../database/models/User';
import { ErrorResponse } from '../models/ErrorResponse';

export const jwtAuth = async (req, res, next) => {
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies.token) {
    token = req.cookies.token;
  }
  if (!token) return next(new ErrorResponse(401, 'unauthorized'));
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const _user = await User.findOne({ _id: decoded._id });
    req.user = _user;
    next();
  } catch (error) {
    return next(new ErrorResponse(401, 'unauthorized'));
  }
};
