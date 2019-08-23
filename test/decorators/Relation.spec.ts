import { Prop } from 'luren-schema'
import { Collection, Field, FieldMetadata, MetadataKey, Relation, RelationMetadata, RelationType } from '../../src'

describe('Relation', () => {
  it('should create one to one relation', () => {
    @Collection()
    class Foo {
      @Prop()
      public name!: string
      @Field({ type: 'number' })
      public bar!: number
    }
    const target = {}
    Relation({ type: RelationType.ONE_TO_ONE, target: Foo })(target, 'foo')
    const relationMetadata: RelationMetadata = Reflect.getMetadata(MetadataKey.RELATION, target, 'foo')
    expect(relationMetadata).toEqual({
      foreignField: '_id',
      localField: '_id',
      target: Foo,
      type: RelationType.ONE_TO_ONE
    })
    const fields: Map<string, FieldMetadata> = Reflect.getMetadata(MetadataKey.FIELDS, target)
    expect(fields.get('foo')).toEqual({
      required: false,
      schema: { type: 'object', classConstructor: Foo, properties: { bar: { type: 'number' } }, required: ['bar'] }
    })
  })
  it('should create one to many relation', () => {
    // tslint:disable-next-line: max-classes-per-file
    @Collection()
    class Foo {
      @Prop()
      public name!: string
      @Field({ type: 'number' })
      public bar!: number
    }
    // tslint:disable-next-line: max-classes-per-file
    class Bar {
      @Relation({ type: RelationType.ONE_TO_MANY, target: Foo, localField: 'foo', foreignField: 'bar' })
      public foo?: Foo[]
      @Relation({ type: RelationType.ONE_TO_ONE, target: Foo })
      @Field({ type: 'object', required: false })
      public another?: Foo
    }

    const relationMetadata: RelationMetadata = Reflect.getMetadata(MetadataKey.RELATION, Bar.prototype, 'foo')
    expect(relationMetadata).toEqual({
      foreignField: 'bar',
      localField: 'foo',
      target: Foo,
      type: RelationType.ONE_TO_MANY
    })
    const fields: Map<string, FieldMetadata> = Reflect.getMetadata(MetadataKey.FIELDS, Bar.prototype)
    expect(fields.get('foo')).toEqual({
      required: false,
      schema: {
        type: 'array',
        items: { type: 'object', classConstructor: Foo, properties: { bar: { type: 'number' } }, required: ['bar'] }
      }
    })
    expect(fields.get('another')).toEqual({
      required: false,
      schema: { type: 'object' }
    })
  })
})
