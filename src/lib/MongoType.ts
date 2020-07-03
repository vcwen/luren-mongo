import _ from 'lodash'
import {
  ArrayType,
  DataTypes,
  DateType,
  IJsonSchema,
  IJsSchema,
  IJsType,
  JsType,
  ObjectType,
  ValidationError,
  ValidationResult,
  PrimitiveType
} from 'luren-schema'
import { copyProperties } from 'luren-schema/dist/lib/utils'
import { ObjectId } from 'mongodb'
import { IBsonSchema } from '../types'

const OTHER_JSON_SCHEMA_PROPS = [
  'title',
  'description',
  'default',
  'examples',
  'enum',
  'const',
  'format',
  'pattern',
  'multipleOf',
  'minimum',
  'exclusiveMinimum',
  'maximum',
  'exclusiveMaximum',
  'minItems',
  'maxItems',
  'uniqueItems',
  'additionalItems',
  'required',
  'additionalProperties'
]

export interface IJsTypeOptions {
  include?: string[]
  exclude?: string[]
}
export interface IMongoType extends IJsType {
  toBsonSchema(schema: IJsSchema): IBsonSchema
}

export abstract class MongoType extends JsType implements IMongoType {
  public abstract type: string
  public abstract toBsonSchema(schema: IJsSchema, options?: IJsTypeOptions): IBsonSchema
}

// tslint:disable-next-line: max-classes-per-file
export abstract class MongoPrimitiveType extends PrimitiveType implements IMongoType {
  public abstract type: string
  public abstract toBsonSchema(schema: IJsSchema, options?: IJsTypeOptions): IBsonSchema
  public deserialize(value: any, schema: IJsSchema): any {
    value = this.getExpectedValue(value, schema)
    const res = this.validate(value, schema)
    if (!res.valid) {
      throw res.error
    }
    return value
  }
  public serialize(value: any | undefined, schema: IJsSchema): any {
    value = this.getExpectedValue(value, schema)
    const res = this.validate(value, schema)
    if (!res.valid) {
      throw res.error
    }
    if (value === undefined && schema) {
      return schema.default
    } else {
      return value
    }
  }
}

// tslint:disable-next-line: max-classes-per-file
export class AnyMongoType extends MongoPrimitiveType implements IMongoType {
  public type: string = 'any'
  public validate() {
    return ValidationResult.ok()
  }
  public deserializationValidate() {
    return ValidationResult.ok()
  }
  public toJsonSchema(): IJsonSchema {
    return {}
  }
  public toBsonSchema() {
    return {}
  }
}

// tslint:disable-next-line: max-classes-per-file
export class StringMongoType extends MongoPrimitiveType implements IMongoType {
  public type: string = 'string'
  public toBsonSchema(schema: IJsSchema) {
    const bsonSchema = this.toJsonSchema(schema)
    Reflect.deleteProperty(bsonSchema, 'type')
    bsonSchema.bsonType = 'string'
    return bsonSchema
  }
}

// tslint:disable-next-line: max-classes-per-file
export class BooleanMongoType extends MongoPrimitiveType implements IMongoType {
  public type: string = 'boolean'
  public toBsonSchema(schema: IJsSchema) {
    const bsonSchema = this.toJsonSchema(schema)
    Reflect.deleteProperty(bsonSchema, 'type')
    bsonSchema.bsonType = 'bool'
    return bsonSchema
  }
}

// tslint:disable-next-line: max-classes-per-file
export class NumberMongoType extends MongoPrimitiveType implements IMongoType {
  public type: string = 'number'
  public toBsonSchema(schema: IJsSchema) {
    const bsonSchema = this.toJsonSchema(schema)
    Reflect.deleteProperty(bsonSchema, 'type')
    bsonSchema.bsonType = 'number'
    return bsonSchema
  }
}

// tslint:disable-next-line: max-classes-per-file
export class IntegerMongoType extends MongoPrimitiveType implements IMongoType {
  public type: string = 'integer'
  public toBsonSchema(schema: IJsSchema) {
    const bsonSchema = this.toJsonSchema(schema)
    Reflect.deleteProperty(bsonSchema, 'type')
    bsonSchema.bsonType = 'int'
    return bsonSchema
  }
}

// tslint:disable-next-line: max-classes-per-file
export class LongMongoType extends MongoPrimitiveType implements IMongoType {
  public type: string = 'long'
  public toBsonSchema(schema: IJsSchema) {
    const bsonSchema = this.toJsonSchema(schema)
    Reflect.deleteProperty(bsonSchema, 'type')
    bsonSchema.bsonType = 'long'
    return bsonSchema
  }
}

// tslint:disable-next-line: max-classes-per-file
export class DateMongoType extends DateType implements IMongoType {
  public validate(value: any): ValidationResult {
    if (value instanceof Date) {
      return ValidationResult.ok()
    } else {
      return new ValidationResult(true, new ValidationError(`invalid date value: ${value}`))
    }
  }
  public serialize(value: any | undefined, schema: IJsSchema): Date {
    value = this.getExpectedValue(value, schema)
    const res = this.validate(value)
    if (!res.valid) {
      throw res.error
    }
    return new Date(value)
  }
  public deserializationValidate(value: any) {
    if (value instanceof Date) {
      return ValidationResult.ok()
    } else {
      return new ValidationResult(true, new ValidationError(`invalid date value: ${value}`))
    }
  }
  public deserialize(value: any | undefined, schema: IJsSchema): Date {
    value = this.getExpectedValue(value, schema)
    const res = this.deserializationValidate(value)
    if (!res.valid) {
      throw res.error
    }
    return new Date(value)
  }
  public toBsonSchema(schema: IJsSchema) {
    const bsonSchema = this.toJsonSchema(schema)
    Reflect.deleteProperty(bsonSchema, 'type')
    bsonSchema.bsonType = 'date'
    return bsonSchema
  }
}

// tslint:disable-next-line: max-classes-per-file
export class ArrayMongoType extends ArrayType implements IMongoType {
  constructor(dataTypes: DataTypes<IMongoType>) {
    super(dataTypes)
  }
  public toBsonSchema(schema: IJsSchema) {
    const bsonSchema: IJsonSchema = { type: 'array' }
    const items = schema.items
    let bsonItems: IJsonSchema | IJsonSchema[] | undefined
    if (items) {
      if (Array.isArray(items)) {
        bsonItems = items.map((item) => {
          const mongoType = this.dataTypes.get(item.type) as IMongoType
          return mongoType.toBsonSchema(item)
        })
      } else {
        const mongoType = this.dataTypes.get(items.type) as IMongoType
        bsonItems = mongoType.toBsonSchema(items)
      }
    }
    copyProperties(bsonSchema, schema, OTHER_JSON_SCHEMA_PROPS)
    if (bsonItems) {
      bsonSchema.items = bsonItems
    }
    if (schema.default) {
      bsonSchema.default = this.serialize(schema.default, schema)
    }
    return bsonSchema
  }
}
// tslint:disable-next-line: max-classes-per-file
export class ObjectMongoType extends ObjectType implements IMongoType {
  public toBsonSchema(schema: IJsSchema) {
    const bsonSchema: IBsonSchema = { bsonType: 'object' }

    const properties = schema.properties
    if (!properties) {
      return bsonSchema
    }
    const props = Object.getOwnPropertyNames(properties)
    if (properties && !_.isEmpty(props)) {
      bsonSchema.properties = {}
      for (const prop of props) {
        const propSchema = properties[prop]
        const mongoType = this.dataTypes.get(propSchema.type) as IMongoType
        Reflect.set(bsonSchema.properties, prop, mongoType.toBsonSchema(propSchema))
      }
    }
    if (schema.required) {
      bsonSchema.required = schema.required
    }
    copyProperties(bsonSchema, schema, OTHER_JSON_SCHEMA_PROPS)
    if (schema.default) {
      bsonSchema.default = this.serialize(schema.default, schema)
    }
    return bsonSchema
  }
}

// tslint:disable-next-line: max-classes-per-file
export class ObjectIdMongoType extends JsType implements IMongoType {
  public type: string = 'objectId'
  public toJsonSchema() {
    return { type: 'string' }
  }
  public toBsonSchema() {
    return { bsonType: 'objectId' }
  }
  public deserializationValidate(val: any) {
    if (val === undefined || ObjectId.isValid(val)) {
      return ValidationResult.ok()
    } else {
      return ValidationResult.error(`Invalid ObjectId: ${val}`)
    }
  }
  public validate(val: any) {
    if (val === undefined || ObjectId.isValid(val)) {
      return ValidationResult.ok()
    } else {
      return ValidationResult.error(`Invalid ObjectId: ${val}`)
    }
  }
  public serialize(value: ObjectId | undefined, schema: IJsSchema) {
    value = this.getExpectedValue(value, schema)
    const res = this.validate(value)
    if (!res.valid) {
      throw res.error
    }
    return new ObjectId(value)
  }
  public deserialize(value: any, schema: IJsSchema) {
    value = this.getExpectedValue(value, schema)
    const res = this.deserializationValidate(value)
    if (!res.valid) {
      throw res.error
    }
    return new ObjectId(value)
  }
}
