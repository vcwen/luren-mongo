import Ajv from 'ajv'
import _ from 'lodash'
const ajv = new Ajv()

export const trimObject = (obj: any, schema: any) => {
  // DOES NOT support oneOf, anyOf, allOf， for simplicity
  if (schema.type === 'object') {
    if (_.isEmpty(schema.properties)) {
      return obj
    } else {
      const trimmed = {} as any
      const props = Object.getOwnPropertyNames(schema.properties)
      for (const prop of props) {
        trimmed[prop] = trimObject(obj[prop], schema.properties[prop])
      }
      return obj
    }
  } else if (schema.type === 'array') {
    if (schema.items) {
      const arr: any[] = obj
      return arr.map((item) => trimObject(item, schema.items))
    } else {
      return obj
    }
  } else {
    return obj
  }
}
export const transform = <T>(obj: any, schema: any, strict: boolean = true) => {
  const valid = ajv.validate(schema, obj)
  if (valid) {
    if (strict) {
      return trimObject(obj, schema) as T
    } else {
      return obj as T
    }
  } else {
    throw new Error('Invalid')
  }
}

const regex = /\/(\w+)(\?.*)?$/
export const getDatabase = (connectUri: string) => {
  const match = regex.exec(connectUri)
  if (match) {
    return match[1]
  }
}
