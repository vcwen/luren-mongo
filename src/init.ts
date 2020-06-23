import { IJsSchema, JsTypes } from 'luren-schema'
import { defineJsSchema } from 'luren-schema/dist/lib/utils'
import { ObjectId, ObjectID } from 'mongodb'
import { defineMongoSchema } from './lib/utils'
import { ObjectIdType } from './lib/JsType'

const objectIdSchema: IJsSchema = {
  type: 'objectId'
}
defineMongoSchema(ObjectId, objectIdSchema)
defineMongoSchema(ObjectID, objectIdSchema)
defineJsSchema(ObjectId, objectIdSchema)
defineJsSchema(ObjectID, objectIdSchema)

JsTypes.register('objectId', new ObjectIdType())
