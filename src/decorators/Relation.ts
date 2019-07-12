import MetadataKey from '../constants/MetadataKey'

export interface IRelationOptions {
  type: string
  localField?: string
  target: any
  foreignField?: string
}

export class RelationMetadata {
  public type: string // hasOne, hasMany, belongsTo
  public localField: string = '_id'
  public target: any
  public foreignField: string = '_id'
  constructor(type: string, target: any) {
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
  }
}
