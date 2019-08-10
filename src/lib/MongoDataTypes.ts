import { Map } from 'immutable'
import _ from 'lodash'
import {
  AnyMongoType,
  ArrayMongoType,
  BooleanMongoType,
  DateMongoType,
  IntegerMongoType,
  NumberMongoType,
  ObjectIdMongoType,
  ObjectMongoType,
  StringMongoType
} from './MongoType'

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
MongoDataTypes.register('any', new AnyMongoType())
MongoDataTypes.register('string', new StringMongoType())
MongoDataTypes.register('boolean', new BooleanMongoType())
MongoDataTypes.register('integer', new IntegerMongoType())
MongoDataTypes.register('number', new NumberMongoType())
MongoDataTypes.register('date', new DateMongoType())
MongoDataTypes.register('array', new ArrayMongoType())
MongoDataTypes.register('object', new ObjectMongoType())
MongoDataTypes.register('objectId', new ObjectIdMongoType())

export default MongoDataTypes
