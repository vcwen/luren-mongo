const mongo: any = jest.genMockFromModule('mongodb')
const { MongoClient } = jest.requireActual('mongodb')

mongo.MongoClient = {
  disableMock: false,
  async connect(uri: string, options: any) {
    this.uri = uri
    this.options = options
    if (this.disableMock) {
      return MongoClient.connect(uri, options)
    } else {
      return {
        db() {},
        isConnected() {
          return true
        },
        close() {}
      }
    }
  }
}
module.exports = mongo
