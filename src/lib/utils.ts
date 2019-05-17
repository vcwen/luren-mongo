import _ from 'lodash'
import { IJsSchema } from 'luren-schema'
import { getSerialize, getDeserialize, getValidate } from 'luren-schema/dist/lib/utils'
import { IDataSchema } from '../types'
// import { Constructor } from '../types'

export const validate = (schema: IJsSchema, data: any): [boolean, string] => {
  const validateFunc = getValidate(schema)
  if (validateFunc) {
    return validateFunc(schema, data)
  } else {
    return [true, '']
  }
}

export const serialize = (schema: IDataSchema, data: any) => {
  let doc = data
  const serializeFunc = getSerialize(schema)
  if (serializeFunc) {
    doc = serializeFunc(schema, data)
  }
  const [valid, msg] = validate(schema, doc)
  if (!valid) {
    throw new Error(msg)
  }
  return doc
}

export const deserialize = (mongoSchema: IJsSchema, doc: any) => {
  const [valid, msg] = validate(mongoSchema, doc)
  if (!valid) {
    throw new Error(msg)
  }
  const deserializeFunc = getDeserialize(mongoSchema)
  if (deserializeFunc) {
    return deserializeFunc(mongoSchema, doc)
  } else {
    return doc
  }
}

export const jsSchemaToDataSchema = (jsSchema: IJsSchema): IDataSchema => {
  const dataSchema: IDataSchema = _.clone(jsSchema)
  return dataSchema
}

const regex = /\/(\w+)(\?.*)?$/
export const getDatabase = (connectUri: string) => {
  const match = regex.exec(connectUri)
  if (match) {
    return match[1]
  }
}
