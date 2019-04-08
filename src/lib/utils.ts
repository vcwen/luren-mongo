import Ajv from 'ajv'
import _ from 'lodash'
import { Constructor } from '../types/Constructor'
const ajv = new Ajv()

export const mapObject = (source: any, target: any, schema: any): any => {
  // source has been validated before this func is invoked
  // DOES NOT support oneOf, anyOf, allOf， for simplicity
  if (_.isEmpty(source)) {
    return source
  }
  if (schema.type === 'object') {
    if (!target) {
      target = {}
    }
    if (_.isEmpty(schema.properties)) {
      return Object.assign(target, source)
    } else {
      const props = Object.getOwnPropertyNames(schema.properties)
      for (const prop of props) {
        target[prop] = mapObject(source[prop], target, schema.properties[prop])
      }
      return target
    }
  } else if (schema.type === 'array' && Array.isArray(source)) {
    if (schema.items) {
      return source.map((item) => mapObject(item, undefined, schema.items))
    } else {
      return source
    }
  } else {
    return source
  }
}
export const transform = <T>(doc: any, schema: any, constructor: Constructor<T>, strict: boolean = true): T => {
  const valid = ajv.validate(schema, doc)
  if (valid) {
    const obj = new constructor()
    if (strict) {
      return mapObject(doc, obj, schema)
    } else {
      return Object.assign(obj, doc)
    }
  } else {
    throw new Error(ajv.errorsText())
  }
}

const regex = /\/(\w+)(\?.*)?$/
export const getDatabase = (connectUri: string) => {
  const match = regex.exec(connectUri)
  if (match) {
    return match[1]
  }
}
