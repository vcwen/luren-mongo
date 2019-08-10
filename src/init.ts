import { DataTypes, IJsSchema, IJsType } from 'luren-schema'
import { ObjectId, ObjectID } from 'mongodb'
import { defineMongoSchema } from './lib/utils'

const objectIdSchema: IJsSchema = {
  type: 'objectId'
}
defineMongoSchema(ObjectId, objectIdSchema)
defineMongoSchema(ObjectID, objectIdSchema)

// tslint:disable-next-line: max-classes-per-file
export class ObjectIdType implements IJsType {
  public type: string = 'file'
  public toJsonSchema() {
    return { type: 'objectId' }
  }
  public validate(val: any): [boolean, string] {
    if (val === undefined || ObjectId.isValid(val)) {
      return [true, '']
    } else {
      return [false, `Invalid ObjectId: ${val}`]
    }
  }
  public serialize(value: ObjectId | undefined, schema: IJsSchema) {
    if (value === undefined) {
      return schema.default
    }
    const [valid, msg] = this.validate(value)
    if (!valid) {
      throw new Error(msg)
    }
    return new ObjectId(value).toHexString()
  }
  public deserialize(value: any, schema: IJsSchema) {
    if (value === undefined) {
      return schema.default
    }
    const [valid, msg] = this.validate(value)
    if (!valid) {
      throw new Error(msg)
    }
    return new ObjectId(value)
  }
}
DataTypes.register('objectId', new ObjectIdType())
