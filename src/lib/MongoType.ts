import _ from 'lodash'
import {
  AnyType,
  ArrayType,
  BooleanType,
  DataTypes,
  DateType,
  IJsonSchema,
  IJsSchema,
  IJsType,
  IntegerType,
  JsType,
  NumberType,
  ObjectType,
  StringType
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
export class AnyMongoType extends AnyType implements IMongoType {
  public toBsonSchema(schema: IJsSchema) {
    const bsonSchema = this.toJsonSchema(schema)
    Reflect.deleteProperty(bsonSchema, 'type')
    return bsonSchema
  }
}

// tslint:disable-next-line: max-classes-per-file
export class StringMongoType extends StringType implements IMongoType {
  public toBsonSchema(schema: IJsSchema) {
    const bsonSchema = this.toJsonSchema(schema)
    Reflect.deleteProperty(bsonSchema, 'type')
    bsonSchema.bsonType = 'string'
    return bsonSchema
  }
}

// tslint:disable-next-line: max-classes-per-file
export class BooleanMongoType extends BooleanType implements IMongoType {
  public toBsonSchema(schema: IJsSchema) {
    const bsonSchema = this.toJsonSchema(schema)
    Reflect.deleteProperty(bsonSchema, 'type')
    bsonSchema.bsonType = 'bool'
    return bsonSchema
  }
}

// tslint:disable-next-line: max-classes-per-file
export class NumberMongoType extends NumberType implements IMongoType {
  public toBsonSchema(schema: IJsSchema) {
    const bsonSchema = this.toJsonSchema(schema)
    Reflect.deleteProperty(bsonSchema, 'type')
    bsonSchema.bsonType = 'number'
    return bsonSchema
  }
}

// tslint:disable-next-line: max-classes-per-file
export class IntegerMongoType extends IntegerType implements IMongoType {
  public toBsonSchema(schema: IJsSchema) {
    const bsonSchema = this.toJsonSchema(schema)
    Reflect.deleteProperty(bsonSchema, 'long')
    bsonSchema.bsonType = 'number'
    return bsonSchema
  }
}

// tslint:disable-next-line: max-classes-per-file
export class DateMongoType extends DateType implements IMongoType {
  public validate(value: any): [boolean, string?] {
    if (value === undefined) {
      return [true]
    }
    if (value instanceof Date) {
      return [true]
    } else {
      return [false, `invalid date value: ${value}`]
    }
  }
  public serialize(value: any | undefined, schema: IJsSchema) {
    const [valid, msg] = this.validate(value)
    if (!valid) {
      throw new Error(msg)
    }
    if (value === undefined) {
      value = this.getDefaultValue(schema)
      if (value === undefined) {
        return undefined
      }
    }
    return value
  }
  public deserialize(value: any | undefined, schema: IJsSchema) {
    if (value === undefined) {
      return this.getDefaultValue(schema)
    } else {
      if (!(value instanceof Date)) {
        throw new Error(`Invalid date value: ${value}`)
      }
      return value
    }
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
  protected dataTypes: DataTypes<MongoType>
  constructor(dataTypes: DataTypes<MongoType>) {
    super(dataTypes)
    this.dataTypes = dataTypes
  }
  public toBsonSchema(schema: IJsSchema) {
    const bsonSchema: IBsonSchema = { bsonType: 'array' }
    const items = schema.items
    let jsonItems: IJsonSchema | IJsonSchema[] | undefined
    if (items) {
      if (Array.isArray(items)) {
        jsonItems = items.map((item) => {
          const mongoType = this.dataTypes.get(item.type)
          return mongoType.toBsonSchema(item)
        })
      } else {
        const jsType = this.dataTypes.get(items.type)
        jsonItems = jsType.toBsonSchema(items)
      }
    }
    if (jsonItems) {
      bsonSchema.items = jsonItems
    }
    copyProperties(bsonSchema, schema, OTHER_JSON_SCHEMA_PROPS)
    return bsonSchema
  }
}
// tslint:disable-next-line: max-classes-per-file
export class ObjectMongoType extends ObjectType implements IMongoType {
  protected dataTypes: DataTypes<MongoType>
  constructor(dataTypes: DataTypes<MongoType>) {
    super(dataTypes)
    this.dataTypes = dataTypes
  }
  public toBsonSchema(schema: IJsSchema) {
    const bsonSchema: IBsonSchema = { bsonType: 'object' }
    const properties = schema.properties
    if (properties) {
      bsonSchema.properties = {}
      for (const prop of Object.getOwnPropertyNames(properties)) {
        const propSchema = properties[prop]
        const jsType = this.dataTypes.get(propSchema.type)
        Reflect.set(bsonSchema.properties, prop, jsType.toBsonSchema(propSchema))
      }
    }
    copyProperties(bsonSchema, schema, OTHER_JSON_SCHEMA_PROPS)
    return bsonSchema
  }
}

// tslint:disable-next-line: max-classes-per-file
export class ObjectIdMongoType extends JsType implements IMongoType {
  public type: string = 'file'
  public toJsonSchema() {
    return { type: 'objectId' }
  }
  public toBsonSchema() {
    return { bsonType: 'objectId' }
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
    return new ObjectId(value)
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
