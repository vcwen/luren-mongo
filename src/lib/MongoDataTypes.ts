import { createPersistDataTypes, IPersistSchema, IPersistTypeOptions } from 'luren-schema'
import { ObjectId, ObjectID } from 'mongodb'
import { defineMongoSchema } from './utils'

export const MongoDataTypes = createPersistDataTypes()

const objectIdSchema: IPersistSchema = {
  type: 'object',
  validate: (_1, val): [boolean, string] => {
    if (ObjectId.isValid(val)) {
      return [true, '']
    } else {
      return [false, `Invalid ObjectId: ${val}`]
    }
  }
}
defineMongoSchema(ObjectId, objectIdSchema)
defineMongoSchema(ObjectID, objectIdSchema)
class ObjectIdPersistTypeOptions implements IPersistTypeOptions {
  public validate(_1: IPersistSchema, val: any): [boolean, string] {
    if (ObjectId.isValid(val)) {
      return [true, '']
    } else {
      return [false, `Invalid ObjectId: ${val}`]
    }
  }
}
MongoDataTypes.add('objectId', new ObjectIdPersistTypeOptions())
