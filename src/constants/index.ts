export const MetadataKey = {
  COLLECTION: Symbol('COLLECTION'),
  MONGO_SCHEMA: Symbol('MONGO_SCHEMA'),
  INDEX: Symbol('INDEX'),
  FIELDS: Symbol('FIELDS'),
  IGNORED_PROPS: Symbol('IGNORED_PROPS'),
  RELATION: Symbol('RELATION')
}

export enum RelationType {
  ONE_TO_ONE = 'ONE_TO_ONE',
  ONE_TO_MANY = 'ONE_TO_MANY'
}

export const enum Types {
  String = 'string',
  Number = 'number',
  Boolean = 'boolean',
  ObjectId = 'objectId',
  Array = 'array',
  Object = 'object'
}
