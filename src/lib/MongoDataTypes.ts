import { Map } from 'immutable'
import _ from 'lodash'
import { IMongoType } from './MongoType'

export class MongoDataTypes {
  public static register(type: string, mongoType: IMongoType) {
    if (this._types.has(type)) {
      throw new Error(`type:${type} already exists`)
    }
    this._types = this._types.set(type, mongoType)
  }
  public static update(type: string, mongoType: IMongoType) {
    this._types = this._types.set(type, mongoType)
  }
  public static get(type: string) {
    const mongoType = this._types.get(type)
    if (!mongoType) {
      throw new Error(`Unknown js type: ${type}`)
    } else {
      return mongoType
    }
  }
  private static _types = Map<string, IMongoType>()
}
