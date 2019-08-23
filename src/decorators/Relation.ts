import { Map } from 'immutable'
import { RelationType } from '../constants'
import { MetadataKey } from '../constants'
import { Constructor } from '../types'
import { Field, FieldMetadata, IFieldOptions } from './Field'

export interface IRelationOptions {
  type: RelationType
  localField?: string
  target: Constructor
  foreignField?: string
}

export class RelationMetadata {
  public type: RelationType
  public localField: string = '_id'
  public target: Constructor
  public foreignField: string = '_id'
  constructor(type: RelationType, target: Constructor) {
    this.type = type
    this.target = target
  }
}

export function Relation(options: IRelationOptions) {
  return (target: object, propertyKey: string) => {
    const relationMetadata = new RelationMetadata(options.type, options.target)
    if (options.localField) {
      relationMetadata.localField = options.localField
    }
    if (options.foreignField) {
      relationMetadata.foreignField = options.foreignField
    }
    Reflect.defineMetadata(MetadataKey.RELATION, relationMetadata, target, propertyKey)
    const fieldMap: Map<string, FieldMetadata> = Reflect.getMetadata(MetadataKey.FIELDS, target) || Map()
    if (!fieldMap.has(propertyKey)) {
      const type = options.type === RelationType.ONE_TO_ONE ? options.target : [options.target]
      const fieldOptions: IFieldOptions = { type, required: false }
      Field(fieldOptions)(target, propertyKey)
    }
  }
}
