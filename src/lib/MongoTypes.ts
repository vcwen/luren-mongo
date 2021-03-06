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
MongoTypes.register('any', new AnyMongoType())
MongoTypes.register('string', new StringMongoType())
MongoTypes.register('boolean', new BooleanMongoType())
MongoTypes.register('integer', new IntegerMongoType())
MongoTypes.register('long', new LongMongoType())
MongoTypes.register('number', new NumberMongoType())
MongoTypes.register('date', new DateMongoType())
MongoTypes.register('array', new ArrayMongoType(MongoTypes))
MongoTypes.register('object', new ObjectMongoType(MongoTypes))
MongoTypes.register('objectId', new ObjectIdMongoType())

export default MongoTypes
