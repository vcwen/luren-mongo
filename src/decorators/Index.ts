import { List } from 'immutable'
import _ from 'lodash'
import { IndexOptions as NativeIndexOptions } from 'mongodb'
import 'reflect-metadata'
import { MetadataKey } from '../constants/MetadataKey'
export class IndexMetadata {
  public fields!: { [key: string]: 1 | -1 | string }
  public options!: NativeIndexOptions
}

export interface IIndexOptions extends NativeIndexOptions {
  name?: string
  spec?: 1 | -1 | string
}

export function Index(options?: IIndexOptions) {
  return (target: any, propertyKey: string) => {
    if (options) {
      const indexMetadata = {} as IndexMetadata
      indexMetadata.fields = { [propertyKey]: options.spec || 1 }
      if (!_.isEmpty(options)) {
        indexMetadata.options = options
      }
      let indexes: List<IndexMetadata> = Reflect.getMetadata(MetadataKey.INDEX, target.constructor) || List()
      indexes = indexes.push(indexMetadata)
      Reflect.defineMetadata(MetadataKey.INDEX, indexes, target.constructor)
    } else {
      const metadata = {} as IndexMetadata
      metadata.fields = { [propertyKey]: 1 }
      let indexes: List<IndexMetadata> = Reflect.getMetadata(MetadataKey.INDEX, target.constructor) || List()
      indexes = indexes.push(metadata)
      Reflect.defineMetadata(MetadataKey.INDEX, indexes, target.constructor)
    }
  }
}

export function CompoundIndex(
  fields: {
    [key: string]: -1 | 1 | string
  },
  options?: NativeIndexOptions
) {
  if (Object.keys(fields).length < 2) {
    throw new Error('There should be at least 2 fields for compound indexes.')
  }
  return (target: any) => {
    let indexes: List<IndexMetadata> = Reflect.getMetadata(MetadataKey.INDEX, target) || List()
    const indexMetadata: any = { fields }
    if (!_.isEmpty(options)) {
      indexMetadata.options = options
    }

    indexes = indexes.push(indexMetadata)
    Reflect.defineMetadata(MetadataKey.INDEX, indexes, target)
  }
}
