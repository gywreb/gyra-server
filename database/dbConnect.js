import mongoose from 'mongoose';

export default class ConnectMongoDB {
  constructor() {
    this.gfs = null;
  }
  static getConnection() {
    if (!mongoose.connection.readyState) {
      mongoose
        .connect(process.env.MONGODB_URL, {
          useNewUrlParser: true,
          useUnifiedTopology: true,
        })
        .then(() => console.log(`DB is connected`.blue))
        .catch(err => console.error(err));
    }
    const conn = mongoose.connection;
    conn.once('open', () => {
      this.gfs = new mongoose.mongo.GridFSBucket(conn.db, {
        bucketName: process.env.MONGODB_BUCKET,
      });
    });
  }
}
