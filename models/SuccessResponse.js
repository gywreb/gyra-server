exports.SuccessResponse = class SuccessResponse {
  constructor(status, data) {
    this.success = true;
    this.status = status;
    this.data = data;
  }
};
