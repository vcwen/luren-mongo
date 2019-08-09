import { DataTypes, IJsSchema } from 'luren-schema'
import { ObjectId, ObjectID } from 'mongodb'
import { MongoDataTypes } from './lib/MongoDataTypes'
import {
  AnyMongoType,
  ArrayMongoType,
  BooleanMongoType,
  DateMongoType,
  IntegerMongoType,
  NumberMongoType,
  ObjectIdMongoType,
  ObjectIdType,
  ObjectMongoType,
  StringMongoType
} from './lib/MongoType'
import { defineMongoSchema } from './lib/utils'

const objectIdSchema: IJsSchema = {
  type: 'objectId'
}
defineMongoSchema(ObjectId, objectIdSchema)
defineMongoSchema(ObjectID, objectIdSchema)

DataTypes.register('objectId', new ObjectIdType())

MongoDataTypes.register('any', new AnyMongoType())
MongoDataTypes.register('string', new StringMongoType())
MongoDataTypes.register('boolean', new BooleanMongoType())
MongoDataTypes.register('integer', new IntegerMongoType())
MongoDataTypes.register('number', new NumberMongoType())
MongoDataTypes.register('date', new DateMongoType())
MongoDataTypes.register('array', new ArrayMongoType())
MongoDataTypes.register('object', new ObjectMongoType())
MongoDataTypes.register('objectId', new ObjectIdMongoType())
