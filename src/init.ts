import { IJsSchema, IValidationResult, JsType, JsTypes, ValidationError, ValidationResult } from 'luren-schema'
import { defineJsSchema } from 'luren-schema/dist/lib/utils'
import { ObjectId, ObjectID } from 'mongodb'
import { defineMongoSchema } from './lib/utils'

const objectIdSchema: IJsSchema = {
  type: 'objectId'
}
defineMongoSchema(ObjectId, objectIdSchema)
defineMongoSchema(ObjectID, objectIdSchema)
defineJsSchema(ObjectId, objectIdSchema)
defineJsSchema(ObjectID, objectIdSchema)

// tslint:disable-next-line: max-classes-per-file
export class ObjectIdType extends JsType {
  public type: string = 'file'
  public toJsonSchema() {
    return { type: 'string' }
  }
  public validate(val: any): IValidationResult {
    if (val === undefined || ObjectId.isValid(val)) {
      return new ValidationResult(true)
    } else {
      return new ValidationResult(false, new ValidationError(`Invalid ObjectId: ${val}`))
    }
  }
  public serialize(value: ObjectId | undefined, schema: IJsSchema) {
    if (value === undefined) {
      return schema.default
    }
    const res = this.validate(value)
    if (!res.valid) {
      throw res.error
    }
    return new ObjectId(value).toHexString()
  }
  public deserialize(value: any, schema: IJsSchema) {
    if (value === undefined) {
      return schema.default
    }
    const res = this.validate(value)
    if (!res.valid) {
      throw res.error
    }
    return new ObjectId(value)
  }
}
JsTypes.register('objectId', new ObjectIdType())
