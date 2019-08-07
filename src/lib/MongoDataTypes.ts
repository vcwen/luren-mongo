import { Map } from 'immutable'
import _ from 'lodash'
import { DataTypes, IJsonSchema, IJsSchema, IJsType, IJsTypeOptions } from 'luren-schema'
import { copyProperties } from 'luren-schema/dist/lib/utils'
import { ObjectId, ObjectID } from 'mongodb'
import { defineMongoSchema, mongoDeserialize, mongoSerialize, mongoValidate } from './utils'

export class MongoDataTypes {
  public static register(type: string, jsType: IJsType) {
    if (this._types.has(type)) {
      throw new Error(`type:${type} already exists`)
    }
    this._types = this._types.set(type, jsType)
  }
  public static update(type: string, jsType: IJsType) {
    this._types = this._types.set(type, jsType)
  }
  public static get(type: string) {
    const jsType = this._types.get(type) || DataTypes.get(type)
    if (!jsType) {
      throw new Error(`Unknown js type: ${type}`)
    } else {
      return jsType
    }
  }
  private static _types = Map<string, IJsType>()
}

const objectIdSchema: IJsSchema = {
  type: 'objectId'
}
defineMongoSchema(ObjectId, objectIdSchema)
defineMongoSchema(ObjectID, objectIdSchema)

// tslint:disable-next-line: max-classes-per-file
class ObjectIdType implements IJsType {
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

// tslint:disable-next-line: max-classes-per-file
class ObjectIdMongoType implements IJsType {
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

// tslint:disable-next-line: max-classes-per-file
export class ObjectMongoType implements IJsType {
  public type: string = 'object'
  public toJsonSchema(schema: IJsSchema) {
    const jsonSchema: IJsonSchema = { type: 'object' }
    const properties = schema.properties
    if (properties) {
      jsonSchema.properties = {}
      for (const prop of Object.getOwnPropertyNames(properties)) {
        const propSchema = properties[prop]
        const jsType = DataTypes.get(propSchema.type)
        Reflect.set(jsonSchema.properties, prop, jsType.toJsonSchema(propSchema))
      }
    }
    copyProperties(jsonSchema, schema, ['additionalProperties'])
    return jsonSchema
  }
  public validate(data: any, schema: IJsSchema, options?: IJsTypeOptions): [boolean, string?] {
    if (data === undefined) {
      return [true]
    }
    if (typeof data !== 'object') {
      return [false, 'Invalid object']
    }
    const properties = schema.properties || {}
    const requiredProps = schema.required
    if (requiredProps) {
      for (const prop of requiredProps) {
        if (Reflect.get(data, prop) === undefined) {
          return [false, `${prop} is required`]
        }
      }
    }

    const propNames = Object.getOwnPropertyNames(properties)
    for (const prop of propNames) {
      const propSchema = properties[prop]
      const value = Reflect.get(data, prop)
      const [valid, msg] = mongoValidate(value, propSchema, options)
      if (!valid) {
        return [valid, msg]
      }
    }
    return [true]
  }
  public serialize(data: object | undefined, schema: IJsSchema, options?: IJsTypeOptions) {
    if (data === undefined) {
      return schema.default
    } else {
      const properties = schema.properties
      const json: any = {}
      if (properties) {
        const propNames = Object.getOwnPropertyNames(properties)
        for (const prop of propNames) {
          if (options) {
            if (options.include) {
              const inclusive = options.include.some((item) => {
                return Reflect.get(data, item)
              })
              if (!inclusive) {
                continue
              }
            }
            if (options.exclude) {
              const exclusive = options.exclude.some((item) => {
                return Reflect.get(data, item)
              })
              if (exclusive) {
                continue
              }
            }
          }
          const propSchema = properties[prop]
          let value = Reflect.get(data, prop)
          value = mongoSerialize(value, propSchema, options)
          if (value === undefined) {
            continue
          }
          Reflect.set(json, prop, value)
        }
        if (schema.additionalProperties) {
          const dataProps = Object.getOwnPropertyNames(data)
          for (const dataProp of dataProps) {
            if (!propNames.includes(dataProp)) {
              const value = Reflect.get(data, dataProp)
              if (value === undefined) {
                continue
              }
              Reflect.set(json, dataProp, value)
            }
          }
        }
      } else {
        Object.assign(json, data)
      }
      return json
    }
  }
  public deserialize(data: object | undefined, schema: IJsSchema, options?: IJsTypeOptions) {
    if (data === undefined) {
      return schema.default
    } else {
      const properties = schema.properties
      if (properties && !_.isEmpty(properties)) {
        const obj = schema.classConstructor ? new schema.classConstructor() : {}
        const propNames = Object.getOwnPropertyNames(properties)
        for (const prop of propNames) {
          const propSchema = properties[prop]
          if (options) {
            if (options.include) {
              const inclusive = options.include.some((item) => {
                return Reflect.get(data, item)
              })
              if (!inclusive) {
                continue
              }
            }
            if (options.exclude) {
              const exclusive = options.exclude.some((item) => {
                return Reflect.get(data, item)
              })
              if (exclusive) {
                continue
              }
            }
          }
          let value = Reflect.get(data, prop)
          value = mongoDeserialize(value, propSchema, options)
          if (value === undefined) {
            continue
          }
          Reflect.set(obj, prop, value)
        }
        if (schema.additionalProperties) {
          const dataProps = Object.getOwnPropertyNames(data)
          for (const dataProp of dataProps) {
            if (!propNames.includes(dataProp)) {
              const value = Reflect.get(data, dataProp)
              if (value === undefined) {
                continue
              }
              Reflect.set(obj, dataProp, value)
            }
          }
        }
        return obj
      } else {
        return data
      }
    }
  }
}

MongoDataTypes.register('objectId', new ObjectIdMongoType())
