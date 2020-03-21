import _ from 'lodash'
import { DataTypes, IJsSchema } from 'luren-schema'
import {
  AnyMongoType,
  ArrayMongoType,
  BooleanMongoType,
  DateMongoType,
  IntegerMongoType,
  LongMongoType,
  MongoType,
  NumberMongoType,
  ObjectIdMongoType,
  ObjectMongoType,
  StringMongoType
} from './MongoType'

export class MongoDataTypes extends DataTypes<MongoType> {
  public toBsonSchema(schema: IJsSchema) {
    const mongoType = this.get(schema.type)
    return mongoType.toBsonSchema(schema)
  }
}

export const MongoTypes = new MongoDataTypes()
MongoTypes.register('any', new AnyMongoType(MongoTypes))
MongoTypes.register('string', new StringMongoType(MongoTypes))
MongoTypes.register('boolean', new BooleanMongoType(MongoTypes))
MongoTypes.register('integer', new IntegerMongoType(MongoTypes))
MongoTypes.register('long', new LongMongoType(MongoTypes))
MongoTypes.register('number', new NumberMongoType(MongoTypes))
MongoTypes.register('date', new DateMongoType(MongoTypes))
MongoTypes.register('array', new ArrayMongoType(MongoTypes))
MongoTypes.register('object', new ObjectMongoType(MongoTypes))
MongoTypes.register('objectId', new ObjectIdMongoType(MongoTypes))

export default MongoTypes
