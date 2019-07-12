import { createPersistDataTypes, IPersistSchema, ITypeOptions } from 'luren-schema'
import { ObjectId, ObjectID } from 'mongodb'
import { defineMongoSchema } from './utils'

export const MongoDataTypes = createPersistDataTypes()

const objectIdSchema: IPersistSchema = {
  type: 'objectId'
}
defineMongoSchema(ObjectId, objectIdSchema)
defineMongoSchema(ObjectID, objectIdSchema)
class ObjectIdPersistTypeOptions implements ITypeOptions {
  public toJsonSchema() {
    return { type: 'objectId' }
  }
  public validate(_1: IPersistSchema, val: any): [boolean, string] {
    if (val === undefined || ObjectId.isValid(val)) {
      return [true, '']
    } else {
      return [false, `Invalid ObjectId: ${val}`]
    }
  }
}
MongoDataTypes.add('objectId', new ObjectIdPersistTypeOptions())
