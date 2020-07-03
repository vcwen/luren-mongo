import { IJsSchema, JsType, ValidationResult } from 'luren-schema'
import { ObjectId } from 'mongodb'
export class ObjectIdType extends JsType {
  public type: string = 'object'
  public toJsonSchema() {
    return { type: 'string' }
  }
  public validate(val: any): ValidationResult {
    if (val === undefined || ObjectId.isValid(val)) {
      return ValidationResult.ok()
    } else {
      return ValidationResult.error(`Invalid ObjectId: ${val}`)
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
  public deserializationValidate(val: any): ValidationResult {
    if (val === undefined || ObjectId.isValid(val)) {
      return ValidationResult.ok()
    } else {
      return ValidationResult.error(`Invalid ObjectId: ${val}`)
    }
  }

  public deserialize(value: any, schema: IJsSchema) {
    if (value === undefined) {
      return this.getDefaultValue(schema)
    }
    const res = this.deserializationValidate(value)
    if (!res.valid) {
      throw res.error
    }
    return new ObjectId(value)
  }
}
